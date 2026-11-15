"""Pure CDC event validation and stable ordering."""
from collections import Counter
from datetime import datetime
from typing import Any

from pydantic import ValidationError

from .schemas import BatchValidation, CdcEvent, QualityFinding

REQUIRED_SALES_FIELDS = frozenset({
    "tenant_id", "sales_line_key", "order_number", "line_number", "sale_date_key",
    "product_key", "customer_key", "store_key", "channel_key", "quantity", "unit_price",
    "gross_amount", "discount_amount", "sale_amount", "cost_amount", "loaded_at",
})
INTEGER_FIELDS = frozenset({"sales_line_key", "line_number", "sale_date_key", "product_key", "customer_key",
                            "store_key", "channel_key", "quantity"})
NUMBER_FIELDS = frozenset({"unit_price", "gross_amount", "discount_amount", "sale_amount", "cost_amount"})
STRING_FIELDS = frozenset({"tenant_id", "order_number", "loaded_at"})
OPERATIONS = frozenset({"insert", "update", "delete"})
FINDING_MESSAGES = {
    "invalid_event": "Uno o más eventos no cumplen el contrato CDC.",
    "missing_business_key": "Uno o más eventos no incluyen clave de negocio.",
    "missing_required_fields": "Uno o más eventos no incluyen todos los campos requeridos.",
    "duplicate_event_id": "Uno o más IDs de evento están duplicados.",
    "tenant_mismatch": "Uno o más eventos no pertenecen al tenant autenticado.",
}


def apply_events_to_state(current_state: dict[int, dict[str, Any]], events: list[CdcEvent]) -> dict[int, dict[str, Any]]:
    """Return a new current-state map while preserving the caller's prior snapshot."""
    state = dict(current_state)
    for event in events:
        if event.operation == "delete":
            state.pop(event.business_key, None)
        else:
            state[event.business_key] = {"after_image": event.after_image, "last_event_id": event.source_event_id}
    return state


def validate_and_order_events(
    raw_events: list[dict[str, Any]], *, tenant_id: str, existing_event_ids: set[str] | None = None
) -> BatchValidation:
    parsed: list[tuple[int, CdcEvent]] = []
    errors: list[tuple[int, str]] = []
    operation_counts = Counter()

    for index, raw in enumerate(raw_events):
        try:
            event = CdcEvent.model_validate(raw)
        except (ValidationError, TypeError, ValueError):
            errors.append((index, "invalid_event"))
            continue
        if event.operation in OPERATIONS:
            operation_counts[event.operation] += 1
        parsed.append((index, event))

    rejected_indexes = {index for index, _ in errors}
    findings_by_code = Counter(code for _, code in errors)
    valid_candidates: list[tuple[int, CdcEvent]] = []
    for index, event in parsed:
        event_errors: set[str] = set()
        if event.business_key is None:
            event_errors.add("missing_business_key")
        if not event.source_event_id:
            event_errors.add("missing_required_fields")
        if event.operation not in OPERATIONS:
            event_errors.add("invalid_event")
        if event.event_timestamp is None or event.event_timestamp.tzinfo is None or event.event_timestamp.utcoffset() is None:
            event_errors.add("missing_required_fields" if event.event_timestamp is None else "invalid_event")
        if event.operation == "delete":
            if event.after_image is not None:
                event_errors.add("invalid_event")
        elif event.operation in {"insert", "update"}:
            if event.after_image is None:
                event_errors.add("missing_required_fields")
            else:
                image = event.after_image
                if REQUIRED_SALES_FIELDS - image.keys() or any(image.get(field) is None for field in REQUIRED_SALES_FIELDS):
                    event_errors.add("missing_required_fields")
                else:
                    if image.get("tenant_id") != tenant_id:
                        event_errors.add("tenant_mismatch")
                    if type(image.get("sales_line_key")) is not int or image.get("sales_line_key") != event.business_key:
                        event_errors.add("invalid_event")
                    if any(type(image.get(field)) is not int for field in INTEGER_FIELDS):
                        event_errors.add("invalid_event")
                    if any(type(image.get(field)) not in {int, float} for field in NUMBER_FIELDS):
                        event_errors.add("invalid_event")
                    if any(not isinstance(image.get(field), str) for field in STRING_FIELDS):
                        event_errors.add("invalid_event")
                    try:
                        datetime.fromisoformat(image["loaded_at"].replace("Z", "+00:00"))
                    except (ValueError, AttributeError):
                        event_errors.add("invalid_event")
        for code in event_errors:
            findings_by_code[code] += 1
            rejected_indexes.add(index)
        if not event_errors:
            valid_candidates.append((index, event))

    id_counts = Counter(event.source_event_id for _, event in parsed if event.source_event_id)
    existing = existing_event_ids or set()
    duplicated_ids = {event_id for event_id, count in id_counts.items() if count > 1} | (set(id_counts) & existing)
    if duplicated_ids:
        duplicate_indexes = {index for index, event in parsed if event.source_event_id in duplicated_ids}
        findings_by_code["duplicate_event_id"] += len(duplicate_indexes)
        rejected_indexes.update(duplicate_indexes)
        valid_candidates = [(index, event) for index, event in valid_candidates if index not in duplicate_indexes]

    events = [event for _, event in valid_candidates]
    has_positions = any(event.source_position is not None for event in events)
    if has_positions and all(event.source_position is not None for event in events):
        position_counts = Counter(event.source_position for event in events)
        events = [event.model_copy(update={"timestamp_ambiguous": position_counts[event.source_position] > 1})
                  for event in sorted(events, key=lambda value: (value.source_position, value.event_timestamp, value.source_event_id))]
    elif has_positions:
        missing_position = [event for event in events if event.source_position is None]
        positioned = [event for event in events if event.source_position is not None]
        position_counts = Counter(event.source_position for event in positioned)
        positioned = [event.model_copy(update={"timestamp_ambiguous": position_counts[event.source_position] > 1})
                      for event in sorted(positioned, key=lambda value: (value.source_position, value.source_event_id))]
        missing_position = [event.model_copy(update={"timestamp_ambiguous": True})
                            for event in sorted(missing_position, key=lambda value: (value.event_timestamp, value.source_event_id))]
        events = positioned + missing_position
    else:
        timestamp_counts = Counter(event.event_timestamp for event in events)
        events = [event.model_copy(update={"timestamp_ambiguous": timestamp_counts[event.event_timestamp] > 1})
                  for event in sorted(events, key=lambda value: (value.event_timestamp, value.source_event_id))]

    findings = [QualityFinding(code=code, rejected_count=count, message=FINDING_MESSAGES[code])
                for code, count in sorted(findings_by_code.items()) if count]
    return BatchValidation(
        events=events,
        findings=findings,
        input_count=len(raw_events),
        insert_count=operation_counts["insert"],
        update_count=operation_counts["update"],
        delete_count=operation_counts["delete"],
        rejected_count=len(rejected_indexes),
        blocked=bool(findings),
    )
