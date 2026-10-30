from conftest import login
from datetime import datetime, timedelta, timezone
import jwt


def test_owner_shares_read_only_and_revokes_on_next_request(client, analyst):
    viewer = login(client, 'viewer')
    other = login(client, 'other-tenant')
    dashboard = client.post('/api/v1/dashboards', headers=analyst, json={'name': 'Compartición aislada'}).json()
    path = '/api/v1/dashboards/' + dashboard['id']
    assert client.get(path, headers=viewer).status_code == 404
    share = client.put(path + '/readers/viewer', headers={**analyst, 'If-Match': '"1"'})
    assert share.status_code == 200
    assert client.get(path, headers=viewer).status_code == 200
    assert client.get(path, headers=viewer).json()['editable'] is False
    assert client.get(path + '/readers', headers=analyst).json()['items'] == [{'subject': 'viewer', 'name': 'Lector de ejemplo'}]
    assert client.get(path + '/readers', headers=viewer).status_code == 403
    assert client.get(path, headers=other).status_code == 404
    assert client.put(path + '/readers/admin', headers=viewer).status_code == 403
    revoke = client.delete(path + '/readers/viewer', headers={**analyst, 'If-Match': share.headers['etag']})
    assert revoke.status_code == 200
    assert client.get(path, headers=viewer).status_code == 404
    query = {'dashboardId': dashboard['id'], 'kpiId': 'kpi_fin_net_revenue', 'modelVersion': 1, 'startDate': '2026-10-01', 'endDate': '2026-10-03'}
    assert client.post('/api/v1/queries', headers=viewer, json=query).status_code == 404


def test_directory_lists_only_existing_synthetic_people_of_tenant(client, analyst):
    response = client.get('/api/v1/dashboard-readers', headers=analyst)
    assert response.status_code == 200
    ids = {person['subject'] for person in response.json()['items']}
    assert 'viewer' in ids
    assert 'otro' not in ids
    assert client.put('/api/v1/dashboards/ventas-q3/readers/otro', headers={**analyst, 'If-Match': '"1"'}).status_code == 404


def test_sharing_rejects_stale_version_and_missing_version(client, analyst):
    path = '/api/v1/dashboards/ventas-q3/readers/viewer'
    assert client.put(path, headers=analyst).status_code == 428
    assert client.put(path, headers={**analyst, 'If-Match': '"9"'}).status_code == 412
    assert client.get('/api/v1/dashboards/ventas-q3', headers=login(client, 'viewer')).status_code == 404


def test_reader_without_catalog_scope_receives_no_widget_identifiers(client, analyst):
    path = '/api/v1/dashboards/ventas-q3'
    kpi = 'kpi_fin_net_revenue'
    added = client.put(path + '/widgets/' + kpi, headers={**analyst, 'If-Match': '"1"'}, json={'kpiId': kpi, 'modelVersion': 1})
    shared = client.put(path + '/readers/viewer', headers={**analyst, 'If-Match': added.headers['etag']})
    assert shared.status_code == 200
    now = datetime.now(timezone.utc)
    token = jwt.encode({'sub': 'viewer', 'tenant_id': 'demo-global', 'scope': 'dashboards:read queries:execute', 'iss': 'synapse-development', 'aud': client.app.state.auth.settings.audience, 'iat': now, 'exp': now + timedelta(minutes=1)}, client.app.state.auth.dev_secret, algorithm='HS256')
    response = client.get(path, headers={'Authorization': 'Bearer ' + token})
    assert response.status_code == 200
    assert response.json()['kpiIds'] == []
    assert response.json()['visualizations'] == 0
    assert kpi not in response.text
    query = {'dashboardId': 'ventas-q3', 'kpiId': kpi, 'modelVersion': 1, 'startDate': '2026-10-01', 'endDate': '2026-10-03'}
    assert client.post('/api/v1/queries', headers={'Authorization': 'Bearer ' + token}, json=query).status_code == 403
    no_dashboard = jwt.encode({'sub': 'viewer', 'tenant_id': 'demo-global', 'scope': 'catalog:read queries:execute', 'iss': 'synapse-development', 'aud': client.app.state.auth.settings.audience, 'iat': now, 'exp': now + timedelta(minutes=1)}, client.app.state.auth.dev_secret, algorithm='HS256')
    assert client.post('/api/v1/queries', headers={'Authorization': 'Bearer ' + no_dashboard}, json=query).status_code == 403


def test_removed_widget_does_not_impersonate_revoked_dashboard(client, analyst):
    path = '/api/v1/dashboards/ventas-q3'
    query = {'dashboardId': 'ventas-q3', 'kpiId': 'kpi_fin_net_revenue', 'modelVersion': 1, 'startDate': '2026-10-01', 'endDate': '2026-10-03'}
    response = client.post('/api/v1/queries', headers=analyst, json=query)
    assert response.status_code == 404
    assert response.json()['error']['code'] == 'dashboard_widget_unavailable'
    assert client.get(path, headers=analyst).status_code == 200


def test_catalog_scope_is_required_before_query_or_widget_resolution(client, analyst):
    now = datetime.now(timezone.utc)
    token = jwt.encode({'sub': 'ana', 'tenant_id': 'demo-global', 'scope': 'dashboards:read dashboards:write queries:execute', 'iss': 'synapse-development', 'aud': client.app.state.auth.settings.audience, 'iat': now, 'exp': now + timedelta(minutes=1)}, client.app.state.auth.dev_secret, algorithm='HS256')
    headers = {'Authorization': 'Bearer ' + token}
    path = '/api/v1/dashboards/ventas-q3'
    version = client.get(path, headers=headers).json()['version']
    for kpi in ('kpi_fin_net_revenue', 'kpi_inexistente'):
        body = {'kpiId': kpi, 'modelVersion': 1, 'startDate': '2026-10-01', 'endDate': '2026-10-03'}
        response = client.post('/api/v1/queries', headers=headers, json=body)
        assert response.status_code == 403
        assert response.json()['error']['code'] == 'permission_denied'
        response = client.put(path + '/widgets/' + kpi, headers={**headers, 'If-Match': f'"{version}"'}, json={'kpiId': kpi, 'modelVersion': 1})
        assert response.status_code == 403
        assert response.json()['error']['code'] == 'permission_denied'
    dashboard = client.get(path, headers=analyst).json()
    assert dashboard['version'] == version
    assert dashboard['kpiIds'] == []
