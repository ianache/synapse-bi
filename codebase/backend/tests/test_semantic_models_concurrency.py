from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from synapse_api.errors import ApiError
from synapse_api.semantic_models.schemas import CloneDraft, PreviewDraft, UpdateDraft
from test_semantic_models_service import setup


def test_clone_update_race_preserves_prior_version(tmp_path):
    _, _, service, user, body, result = setup(tmp_path)
    mid, did = result['model']['id'], result['draft']['id']
    preview = service.preview(user, mid, did, PreviewDraft(kpiIds=[]), '"1"')
    barrier = Barrier(2)
    def clone():
        barrier.wait(timeout=10)
        return service.clone(user, mid, CloneDraft(sourceDraftId=did), '"1"', 'clone', 'req')
    def edit():
        barrier.wait(timeout=10)
        try:
            return service.update(user, mid, did, UpdateDraft(kpiIds=[], candidateDigest=preview['candidateDigest']), '"1"', 'req')
        except ApiError as exc:
            return exc.code
    with ThreadPoolExecutor(max_workers=2) as pool:
        cloned, edited = pool.submit(clone), pool.submit(edit)
        try:
            new = cloned.result(timeout=30)
            old_update = edited.result(timeout=30)
        except ApiError as exc:
            # If edit wins it increments model revision; stale clone cannot silently proceed.
            assert exc.code == 'version_conflict'
            assert edited.result(timeout=30)['revision'] == 2
            return
    assert old_update == 'draft_not_editable'
    assert service.get_draft(user, mid, did) == result['draft']
    assert new['capture'] == result['draft']['capture']


def test_read_single_snapshot(tmp_path, monkeypatch):
    from synapse_api.semantic_models.repository import ModelRepository
    _, _, service, user, _, result = setup(tmp_path)
    mid, did = result['model']['id'], result['draft']['id']
    original = ModelRepository.model
    changed = False
    def interleave(repo, model_id):
        nonlocal changed
        row = original(repo, model_id)
        if not changed:
            changed = True
            service.clone(user, mid, CloneDraft(sourceDraftId=did), '"1"', 'concurrent', 'req')
        return row
    monkeypatch.setattr(ModelRepository, 'model', interleave)
    snapshot = service.get(user, mid)
    assert snapshot['model']['revision'] == 1
    assert snapshot['draft']['sequence'] == 1
    assert service.get(user, mid)['draft']['sequence'] == 2
