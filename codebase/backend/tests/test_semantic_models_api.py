import json
from uuid import uuid4

import pytest

from conftest import login

BASE = '/api/v1/semantic-models'


def create_model(client):
    admin = login(client, 'data-admin')
    domain = client.post('/api/v1/semantic-catalog/domains', json={'name': 'Operaciones'},
                         headers=admin | {'Idempotency-Key': str(uuid4())}).json()
    response = client.post(BASE, json={'name': 'Modelo propio', 'domainId': domain['id']},
                           headers=admin | {'Idempotency-Key': 'create'})
    assert response.status_code == 201, response.text
    return admin, response


def test_routes_headers_scope_matrix(client):
    assert client.get(BASE).status_code == 401
    admin, created = create_model(client)
    result = created.json()
    mid, draft = result['model']['id'], result['draft']
    assert created.headers['etag'] == '"1"'
    assert created.headers['location'] == BASE + '/' + mid
    assert client.get(created.headers['location'], headers=admin).json() == result
    analyst = login(client)
    assert client.get(BASE, headers=analyst).status_code == 403
    assert 'models:read' not in client.get('/api/v1/me', headers=analyst).json()['scopes']
    other = login(client, 'other-data-admin')
    assert client.get(BASE + '/' + mid, headers=other).status_code == 404
    assert client.get(BASE, headers=other).json()['total'] == 0
    path = BASE + f'/{mid}/drafts/{draft["id"]}'
    assert client.get(path, headers=admin).headers['etag'] == '"1"'
    assert client.post(path + '/preview', json={'kpiIds': []}, headers=admin).status_code == 428
    preview = client.post(path + '/preview', json={'kpiIds': []}, headers=admin | {'If-Match': '"1"'})
    assert preview.status_code == 200 and preview.json()['changes'] == []
    update = {'kpiIds': [], 'candidateDigest': preview.json()['candidateDigest']}
    assert client.put(path, json=update, headers=admin | {'If-Match': '"2"'}).status_code == 412
    saved = client.put(path, json=update, headers=admin | {'If-Match': '"1"'})
    assert saved.status_code == 200 and saved.headers['etag'] == '"2"'
    cloned = client.post(BASE + f'/{mid}/drafts', json={'sourceDraftId': draft['id']},
                         headers=admin | {'If-Match': '"2"', 'Idempotency-Key': 'clone'})
    assert cloned.status_code == 201 and cloned.json()['sequence'] == 2
    assert client.get(cloned.headers['location'], headers=admin).status_code == 200
    compare = client.get(BASE + f'/{mid}/compare', params={'leftDraftId': draft['id'], 'rightDraftId': cloned.json()['id']}, headers=admin)
    assert compare.status_code == 200 and compare.json()['changes'] == []
    assert client.get(BASE + f'/{mid}/drafts', headers=admin).json()['total'] == 2
    # Drafts do not enter the preexisting published KPI registry.
    assert client.get('/api/v1/kpis/' + draft['id'], headers=analyst).status_code == 404


@pytest.mark.parametrize('query', ['unknown=x', 'limit=0', 'limit=101', 'offset=-1', 'domainId=bad'])
def test_query_validation(client, query):
    admin = login(client, 'data-admin')
    assert client.get(BASE + '?' + query, headers=admin).status_code == 422


def test_real_body_limit_media_type_and_redaction(client):
    admin = login(client, 'data-admin')
    prefix, suffix = b'{"name":"', b'"}'
    for size, expected in [(262144, 422), (262145, 413)]:
        payload = prefix + b'x' * (size - len(prefix) - len(suffix)) + suffix
        response = client.post(BASE, content=iter([payload[:10000], payload[10000:]]),
            headers=admin | {'Content-Type': 'application/json', 'Content-Length': '1'})
        assert response.status_code == expected
        assert 'xxxxxxxx' not in response.text and response.json()['error']['requestId']
    assert client.post(BASE, content='{}', headers=admin | {'Content-Type': 'text/plain'}).status_code == 415
    schema = client.get('/openapi.json').json()
    assert BASE + '/{model_id}/drafts/{draft_id}/preview' in schema['paths']
