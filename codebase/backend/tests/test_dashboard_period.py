def test_owner_saves_explicit_initial_period_and_readers_cannot_edit(client, analyst):
    path = '/api/v1/dashboards/ventas-q3'
    response = client.put(path + '/initial-period', headers={**analyst, 'If-Match': '"1"'}, json={'startDate': '2026-10-01', 'endDate': '2026-10-03'})
    assert response.status_code == 200
    assert response.json()['initialPeriod'] == {'startDate': '2026-10-01', 'endDate': '2026-10-03'}
    assert client.get(path, headers=analyst).json()['initialPeriod'] == response.json()['initialPeriod']
    assert client.put(path + '/initial-period', headers={**analyst, 'If-Match': response.headers['etag']}, json={'startDate': '2026-10-04', 'endDate': '2026-10-03'}).status_code == 422


def test_existing_dashboard_without_initial_period_does_not_invent_one(client, analyst):
    assert client.get('/api/v1/dashboards/ventas-q3', headers=analyst).json()['initialPeriod'] is None
