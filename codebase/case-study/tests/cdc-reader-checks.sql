\set ON_ERROR_STOP on
DO $$
DECLARE
  expected_tenant text;
  visible_events bigint;
  other_tenant_events bigint;
BEGIN
  expected_tenant := CASE current_user
    WHEN 'bi_reader_global' THEN 'demo-global'
    WHEN 'bi_reader_other' THEN 'demo-other'
    ELSE NULL END;
  IF expected_tenant IS NULL THEN RAISE EXCEPTION 'Unexpected CDC reader role: %',current_user; END IF;

  SELECT count(*) INTO visible_events FROM gold.cdc_sales_events;
  SELECT count(*) INTO other_tenant_events FROM gold.cdc_sales_events
    WHERE tenant_id <> expected_tenant;
  IF visible_events < 1080 THEN RAISE EXCEPTION 'Reader cannot see its seeded CDC history'; END IF;
  IF other_tenant_events <> 0 THEN RAISE EXCEPTION 'Reader can see another tenant CDC event'; END IF;

  IF has_table_privilege(current_user,'prepared.dataset_versions','SELECT') IS NOT TRUE OR
     has_table_privilege(current_user,'prepared.version_events','SELECT') IS NOT TRUE OR
     has_table_privilege(current_user,'prepared.current_sales_state','SELECT') IS NOT TRUE THEN
    RAISE EXCEPTION 'Prepared consumer reader grants are incomplete';
  END IF;
  IF has_table_privilege(current_user,'prepared.preparation_runs','SELECT') OR
     has_table_privilege(current_user,'prepared.pipeline_checkpoints','SELECT') THEN
    RAISE EXCEPTION 'Prepared consumers must not read execution evidence or checkpoints directly';
  END IF;

  IF (SELECT count(*) FROM prepared.version_events) <> 0 OR
     (SELECT count(*) FROM prepared.current_sales_state) <> 0 THEN
    RAISE EXCEPTION 'Empty lab must not expose rows from another tenant';
  END IF;
END $$;
\echo 'PASS: tenant source CDC visibility and prepared reader grants'
