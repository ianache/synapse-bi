def test_diff_text_not_math_and_stable_order():
    from synapse_api.semantic_models.diff import compare_captures
    left = {'domain': {'id': 'd', 'version': 1, 'name': 'Ventas'},
            'kpis': [{'id': 'k', 'version': 1, 'formula': 'a+b'}],
            'components': [{'id': 'm', 'version': 1, 'definition': 'Importe'}]}
    right = {'domain': {'id': 'd', 'version': 1, 'name': 'Ventas'},
             'kpis': [{'id': 'k', 'version': 2, 'formula': 'b+a'}],
             'components': [{'id': 'n', 'version': 1, 'definition': 'Cantidad'}]}
    changes = compare_captures(left, right)
    assert [(c['kind'], c['id'], c['field'], c['change']) for c in changes] == [
        ('component', 'm', '', 'removed'), ('component', 'n', '', 'added'),
        ('kpi', 'k', 'formula', 'modified'), ('kpi', 'k', 'version', 'modified')]
    assert changes[2]['before'] == 'a+b' and changes[2]['after'] == 'b+a'
    assert compare_captures(left, left) == []
