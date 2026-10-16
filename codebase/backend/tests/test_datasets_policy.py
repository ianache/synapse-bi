"""Catch unsafe acceptance/normalization and false registration of incomplete metadata."""
from copy import deepcopy

import pytest
from pydantic import ValidationError

from synapse_api.datasets.schemas import SaveDataset
from synapse_api.datasets.policy import missing_metadata, normalize_name, validate_registration
from synapse_api.errors import ApiError


def body():
    return {"name": "Ventas", "kind": "direct", "saveAs": "draft",
            "origin": {"sourceId": "s1", "observationId": "o1", "schema": "gold", "object": "fact_sales"},
            "selectedColumns": ["sale_amount"], "governance": {"owner": "   "}}


def test_draft_missing_fields():
    draft = SaveDataset.model_validate(body())
    assert draft.governance.owner is None
    assert missing_metadata(draft) == ["owner", "classification", "freshnessExpectation"]
    validate_registration(draft)
    assert draft.save_as == "draft"


def test_registered_requires_metadata():
    data = body()
    data["saveAs"] = "registered"
    with pytest.raises(ApiError) as caught:
        validate_registration(SaveDataset.model_validate(data))
    assert (caught.value.status, caught.value.code) == (422, "metadata_incomplete")
    assert caught.value.details == {"missingMetadata": ["owner", "classification", "freshnessExpectation"]}
    data["governance"] = {"owner": " Equipo ", "classification": " Interna ", "freshnessExpectation": "Diaria"}
    complete = SaveDataset.model_validate(data)
    validate_registration(complete)
    assert missing_metadata(complete) == []
    data["saveAs"] = "draft"
    assert SaveDataset.model_validate(data).save_as == "draft"


def test_prepared_medallion_missing_order():
    data = body() | {"kind": "prepared", "preparation": {}, "medallion": {}}
    assert missing_metadata(SaveDataset.model_validate(data)) == [
        "owner", "classification", "freshnessExpectation", "preparation.processReference", "preparation.inputOrigins",
        "medallion.schemaDescription", "medallion.partitionPolicy", "medallion.retentionPolicy",
        "medallion.minimumQuality", "medallion.tenantPolicy"]
    with pytest.raises(ValidationError):
        SaveDataset.model_validate(body() | {"preparation": {}})


@pytest.mark.parametrize("changes", [
    {"name": " "}, {"name": "bad\nname"}, {"name": "x" * 101}, {"description": "x" * 2001},
    {"selectedColumns": []}, {"selectedColumns": [str(n) for n in range(501)]},
    {"selectedColumns": ["a", "a"]}, {"selectedColumns": ["x" * 129]},
    {"governance": {"owner": "x" * 501}}, {"tenant": "foreign"}, {"governanceValidation": "approved"},
    {"kind": "prepared", "preparation": {"processReference": "x" * 1001}},
    {"medallion": {"tenantPolicy": "x" * 501}},
])
def test_unicode_and_limits_reject(changes):
    with pytest.raises(ValidationError):
        SaveDataset.model_validate(body() | changes)


def test_unicode_and_limits_accept():
    assert normalize_name("  CAFE\u0301  ") == "café"
    data = body() | {"name": "  CAFE\u0301  ", "description": "x" * 2000,
                     "selectedColumns": ['revenue "USD"'] + [str(n) for n in range(499)],
                     "governance": {"owner": "x" * 500}}
    assert SaveDataset.model_validate(data).name == "CAFÉ"
    assert SaveDataset.model_validate(body() | {"name": "x" * 100, "selectedColumns": ["x" * 128]}).name == "x" * 100
    origin = deepcopy(data["origin"])
    data.update(kind="prepared", preparation={"processReference": "x" * 1000, "inputOrigins": [origin] * 20})
    assert len(SaveDataset.model_validate(data).preparation.input_origins) == 20
    data["preparation"]["inputOrigins"].append(origin)
    with pytest.raises(ValidationError):
        SaveDataset.model_validate(data)
