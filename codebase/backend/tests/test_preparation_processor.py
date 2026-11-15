from datetime import datetime, timezone

from synapse_api.preparation.processor import apply_events_to_state, validate_and_order_events
from synapse_api.preparation.schemas import CdcEvent


def event(event_id, operation, timestamp, *, position=None, key=1, after_image=None):
    return {
        "sourceEventId": event_id,
        "businessKey": key,
        "operation": operation,
        "eventTimestamp": timestamp,
        "sourcePosition": position,
        "afterImage": after_image if operation != "delete" else None,
    }


def image(tenant="demo-global", key=1, quantity=2):
    return {
        "tenant_id": tenant, "sales_line_key": key, "order_number": "ORD-1", "line_number": 1,
        "sale_date_key": 20260901, "product_key": 1, "customer_key": 1, "store_key": 1,
        "channel_key": 1, "quantity": quantity, "unit_price": 10.0, "gross_amount": quantity * 10.0,
        "discount_amount": 0.0, "sale_amount": quantity * 10.0, "cost_amount": quantity * 6.0,
        "loaded_at": "2026-09-01T00:00:00+00:00",
    }


def test_valid_events_order_by_source_position_and_preserve_insert_update_delete():
    result = validate_and_order_events([
        event("e3", "delete", "2026-09-03T00:00:00+00:00", position=3),
        event("e1", "insert", "2026-09-01T00:00:00+00:00", position=1, after_image=image()),
        event("e2", "update", "2026-09-02T00:00:00+00:00", position=2, after_image=image(quantity=3)),
    ], tenant_id="demo-global")

    assert [item.source_event_id for item in result.events] == ["e1", "e2", "e3"]
    assert [item.operation for item in result.events] == ["insert", "update", "delete"]
    assert all(not item.timestamp_ambiguous for item in result.events)
    assert result.findings == []


def test_missing_key_invalid_event_missing_fields_duplicate_ids_block_batch():
    result = validate_and_order_events([
        {"sourceEventId": "missing-key", "operation": "insert", "eventTimestamp": "2026-09-01T00:00:00+00:00",
         "afterImage": image()},
        event("duplicate", "insert", "2026-09-01T00:00:00+00:00", position=2, after_image={"sales_line_key": 1}),
        event("duplicate", "bad-op", "2026-09-01T00:00:00+00:00", position=3),
    ], tenant_id="demo-global")

    codes = {finding.code for finding in result.findings}
    assert {"missing_business_key", "invalid_event", "missing_required_fields", "duplicate_event_id"} <= codes
    assert result.blocked is True


def test_equal_fallback_timestamps_are_retained_and_marked_ambiguous():
    stamp = "2026-09-01T00:00:00+00:00"
    result = validate_and_order_events([
        event("b", "insert", stamp, key=2, after_image=image(key=2)),
        event("a", "insert", stamp, after_image=image(key=1)),
    ], tenant_id="demo-global")

    assert [item.source_event_id for item in result.events] == ["a", "b"]
    assert all(item.timestamp_ambiguous for item in result.events)


def test_events_with_other_tenant_image_are_rejected_without_exposing_image():
    result = validate_and_order_events([
        event("foreign", "insert", "2026-09-01T00:00:00+00:00", after_image=image(tenant="demo-other")),
    ], tenant_id="demo-global")

    assert result.blocked is True
    assert "tenant_mismatch" in {finding.code for finding in result.findings}
    assert "demo-other" not in str(result.findings)


def test_materialization_applies_insert_update_and_delete_to_version_state():
    first = CdcEvent.model_validate(event("e1", "insert", "2026-09-01T00:00:00+00:00", position=1, after_image=image()))
    update = CdcEvent.model_validate(event("e2", "update", "2026-09-02T00:00:00+00:00", position=2, after_image=image(quantity=4)))
    delete = CdcEvent.model_validate(event("e3", "delete", "2026-09-03T00:00:00+00:00", position=3))

    state = apply_events_to_state({}, [first, update])
    assert state[1]["after_image"]["quantity"] == 4
    state = apply_events_to_state(state, [delete])
    assert state == {}
