"""Structural comparison only: formulas remain uninterpreted text."""


def _fields(document, prefix=''):
    result = {}
    for key, value in document.items():
        if key == 'id' and not prefix:
            continue
        path = f'{prefix}.{key}' if prefix else key
        if isinstance(value, dict) and value:
            result.update(_fields(value, path))
        else:
            result[path] = value
    return result


def compare_captures(left: dict, right: dict) -> list[dict]:
    changes = []
    for kind, key in [('component', 'components'), ('domain', 'domain'), ('kpi', 'kpis')]:
        old = {item['id']: item for item in ([left[key]] if key == 'domain' else left[key])}
        new = {item['id']: item for item in ([right[key]] if key == 'domain' else right[key])}
        for item_id in sorted(old.keys() | new.keys()):
            if item_id not in old or item_id not in new:
                changes.append({'kind': kind, 'id': item_id, 'field': '',
                                'change': 'added' if item_id in new else 'removed',
                                'before': old.get(item_id), 'after': new.get(item_id)})
                continue
            before, after = _fields(old[item_id]), _fields(new[item_id])
            for field in sorted(before.keys() | after.keys()):
                if before.get(field) != after.get(field):
                    changes.append({'kind': kind, 'id': item_id, 'field': field, 'change': 'modified',
                                    'before': before.get(field), 'after': after.get(field)})
    return changes
