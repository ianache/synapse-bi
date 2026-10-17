import json
import sqlite3
from uuid import uuid4

import pytest

from conftest import login

BASE = '/api/v1/semantic-catalog'


def post(client, headers, path, body, key=None):
    return client.post(BASE + path, json=body, headers=headers | {'Idempotency-Key': key or str(uuid4())})


def domain(client, headers):
    result = post(client, headers, '/domains', {'name': 'Logística'})
    assert result.status_code == 201, result.text
    return result.json()


def test_contract_create_get_list_update_replay_and_headers(client):
    admin = login(client, 'data-admin')
    created = post(client, admin, '/domains', {'name': 'Logística'}, 'key')
    assert created.status_code == 201
    item = created.json()
    assert item['status'] == 'draft' and item['missingMetadata'] == ['description', 'owner']
    assert created.headers['etag'] == '"1"'
    assert created.headers['location'] == BASE + '/domains/' + item['id']
    updated = client.put(created.headers['location'], json={'name': 'Operaciones'}, headers=admin | {'If-Match': '"1"'})
    assert updated.status_code == 200 and updated.headers['etag'] == '"2"'
    assert post(client, admin, '/domains', {'name': 'Logística'}, 'key').json() == item
    assert client.get(created.headers['location'], headers=admin).json()['name'] == 'Operaciones'
    page = client.get(BASE + '/domains?q=operaciones&limit=1', headers=admin).json()
    assert page['total'] == 1 and page['items'][0]['id'] == item['id']


def test_component_kpi_and_copy_journey(client):
    admin = login(client, 'data-admin')
    d = domain(client, admin)
    body = dict(name='Tiempo', domainId=d['id'], kind='measure')
    comp = post(client, admin, '/components', body)
    assert comp.status_code == 201
    m = comp.json()
    k = post(client, admin, '/kpi-definitions', dict(name='KPI', domainId=d['id'], measureIds=[m['id']]))
    assert k.status_code == 201 and k.json()['measureIds'] == [m['id']]
    assert client.get(BASE + f'/components/{m["id"]}/consumers', headers=admin).json()['total'] == 1
    blocked = client.put(BASE + f'/components/{m["id"]}', json=body, headers=admin | {'If-Match': '"1"'})
    assert blocked.status_code == 409 and blocked.json()['error']['code'] == 'component_protected'
    copied = post(client, admin, f'/components/{m["id"]}/copies', {'name': 'Tiempo ajustado'})
    assert copied.status_code == 201 and copied.json()['copyOriginId'] == m['id']
    assert copied.json()['consumerCount'] == 0 and copied.json()['protected'] is False


@pytest.mark.parametrize('route', ['/domains', '/components', '/kpi-definitions'])
def test_authentication_and_unchanged_analyst_permissions(client, route):
    assert client.get(BASE + route).status_code == 401
    analyst = login(client, 'analyst')
    me = client.get('/api/v1/me', headers=analyst).json()
    assert 'semantic:write' not in me['scopes']
    assert client.get(BASE + route, headers=analyst).status_code == 403
    assert post(client, analyst, route, {'name': 'X'}).status_code == 403


def test_other_tenant_is_not_visible_and_cannot_be_referenced(client):
    admin, other = login(client, 'data-admin'), login(client, 'other-data-admin')
    d = domain(client, admin)
    assert client.get(BASE + f'/domains/{d["id"]}', headers=other).status_code == 404
    assert post(client, other, '/components', dict(name='Leak', kind='measure', domainId=d['id'])).status_code == 404
    assert client.get(BASE + '/domains', headers=other).json()['total'] == 0
    assert client.put(BASE + f'/domains/{d["id"]}', json={'name': 'Bad'}, headers=other | {'If-Match': '"1"'}).status_code == 404


@pytest.mark.parametrize('query', ['unknown=x', 'limit=0', 'limit=101', 'offset=-1', 'q=' + 'x' * 101])
def test_query_limits_and_unknown_fields(client, query):
    assert client.get(BASE + '/domains?' + query, headers=login(client, 'data-admin')).status_code == 422


def test_preconditions_and_invalid_input_are_safe(client):
    admin = login(client, 'data-admin')
    d = domain(client, admin)
    for match, expected in [(None, 428), ('1', 422), ('"2"', 412)]:
        headers = admin | ({'If-Match': match} if match else {})
        response = client.put(BASE + f'/domains/{d["id"]}', json={'name': 'Change'}, headers=headers)
        assert response.status_code == expected
    secret = 'PRIVATE-INPUT-DO-NOT-LOG'
    response = post(client, admin, '/domains', {'name': 'X', 'tenant': secret})
    assert response.status_code == 422 and secret not in response.text
    assert client.post(BASE + '/domains', json={'name': 'X'}, headers=admin).status_code == 422
    assert post(client, admin, '/domains', {'name': 'LOGÍSTICA'}).status_code == 409


def test_chunked_body_limit_media_type_and_safe_errors(client):
    admin = login(client, 'data-admin')
    content = json.dumps({'name': 'X', 'description': 'z' * 270000}).encode()
    response = client.post(BASE + '/domains', content=iter([content[:10000], content[10000:]]),
                           headers=admin | {'Content-Type': 'application/json', 'Content-Length': '1', 'Idempotency-Key': 'x'})
    assert response.status_code == 413
    assert 'zzzz' not in response.text
    response = client.post(BASE + '/domains', content='{}', headers=admin | {'Content-Type': 'text/plain'})
    assert response.status_code == 415


def test_unavailable_storage_is_safe(client, monkeypatch):
    admin = login(client, 'data-admin')
    def unavailable(*args, **kwargs):
        raise sqlite3.OperationalError('PRIVATE-DATABASE-PATH')
    monkeypatch.setattr(client.app.state.database, 'connect', unavailable)
    response = client.get(BASE + '/domains', headers=admin)
    assert response.status_code == 503 and 'PRIVATE' not in response.text


def test_openapi_documents_catalog_models_without_execution_routes(client):
    schema = client.get('/openapi.json').json()
    for model in ['SaveDomain', 'SaveComponent', 'SaveKpiDefinition', 'CopyComponent', 'Domain', 'Component', 'KpiDefinition']:
        assert model in schema['components']['schemas']
    paths = [p for p in schema['paths'] if p.startswith(BASE)]
    assert len(paths) == 8
    assert all('delete' not in schema['paths'][path] for path in paths)
