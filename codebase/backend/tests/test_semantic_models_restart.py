from synapse_api.database import Database
from test_semantic_models_service import setup


def test_restart_preserves_captured_content(tmp_path):
    from synapse_api.semantic_models.service import SemanticModelsService
    db, _, _, user, _, result = setup(tmp_path)
    reopened = Database(db.path)
    reopened.initialize()
    assert SemanticModelsService(reopened).get(user, result['model']['id']) == result
