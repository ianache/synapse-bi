import unicodedata


def normalize_name(value: str) -> str:
    return unicodedata.normalize('NFC', value.strip()).casefold()


KPI_FIELDS = ('definition', 'formula', 'unit', 'grain', 'owner', 'steward',
              'classification', 'accessPolicy', 'freshnessExpectation',
              'qualityExpectation', 'filters', 'nullPolicy', 'returnPolicy',
              'lateDataPolicy', 'validFrom', 'dimensionIds', 'measureIds')


def missing_metadata(kind: str, document: dict) -> list[str]:
    if kind == 'domain':
        fields = ('description', 'owner')
    elif kind == 'component':
        fields = ('definition', 'grain', 'binding')
        if document['kind'] == 'measure':
            fields += ('unit', 'aggregation')
    elif kind == 'kpi':
        fields = KPI_FIELDS
    else:
        raise ValueError('Unknown semantic resource')
    return [field for field in fields if not document.get(field)]
