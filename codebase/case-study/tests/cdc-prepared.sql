\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
  sales_count bigint;
  event_count bigint;
  relation_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='gold' AND c.relname='cdc_sales_events' AND c.relrowsecurity AND c.relforcerowsecurity
  ) THEN RAISE EXCEPTION 'CDC source table must enforce RLS'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='dataset_versions' AND c.relrowsecurity AND c.relforcerowsecurity
  ) THEN RAISE EXCEPTION 'Prepared versions must enforce RLS'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='version_events' AND c.relrowsecurity AND c.relforcerowsecurity
  ) THEN RAISE EXCEPTION 'Prepared history must enforce RLS'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='current_sales_state' AND c.relrowsecurity AND c.relforcerowsecurity
  ) THEN RAISE EXCEPTION 'Prepared current state must enforce RLS'; END IF;

  SELECT count(*) INTO relation_count FROM information_schema.tables
  WHERE table_schema='prepared' AND table_name IN (
    'preparation_runs','pipeline_checkpoints','dataset_versions','version_events','current_sales_state'
  );
  IF relation_count <> 5 THEN RAISE EXCEPTION 'Expected five prepared relations, found %', relation_count; END IF;

  IF has_table_privilege('bi_reader_global','gold.cdc_sales_events','INSERT') OR
     has_table_privilege('bi_reader_other','gold.cdc_sales_events','UPDATE') OR
     has_table_privilege('bi_reader_global','gold.cdc_sales_events','DELETE') THEN
    RAISE EXCEPTION 'CDC source readers must remain read-only';
  END IF;
  IF NOT has_table_privilege('bi_reader_global','gold.cdc_sales_events','SELECT') OR
     NOT has_table_privilege('bi_reader_other','gold.cdc_sales_events','SELECT') THEN
    RAISE EXCEPTION 'CDC source readers need SELECT';
  END IF;
  IF NOT has_table_privilege('bi_prepared_writer','prepared.preparation_runs','INSERT') OR
     NOT has_table_privilege('bi_prepared_writer','prepared.dataset_versions','INSERT') THEN
    RAISE EXCEPTION 'Prepared writer is missing required insert grants';
  END IF;
  IF has_table_privilege('bi_prepared_writer','gold.fact_sales','INSERT') OR
     has_table_privilege('bi_prepared_writer','gold.fact_sales','UPDATE') OR
     has_table_privilege('bi_prepared_writer','gold.fact_sales','DELETE') THEN
    RAISE EXCEPTION 'Prepared writer must not modify Gold';
  END IF;

  SELECT count(*) INTO sales_count FROM gold.fact_sales;
  IF sales_count <> 2160 THEN RAISE EXCEPTION 'Expected unchanged Gold fact count 2160; found %', sales_count; END IF;
  SELECT count(*) INTO event_count FROM gold.cdc_sales_events;
  IF event_count <= sales_count THEN RAISE EXCEPTION 'Expected seeded insert/update/delete CDC events'; END IF;
  IF EXISTS (
    SELECT tenant_id FROM gold.cdc_sales_events GROUP BY tenant_id
    HAVING count(*) <= (SELECT count(*) FROM gold.fact_sales s WHERE s.tenant_id=gold.cdc_sales_events.tenant_id)
  ) THEN RAISE EXCEPTION 'Each tenant needs CDC changes beyond initial inserts'; END IF;
END $$;

-- Published version content cannot be mutated, even by the owner in normal lab use.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='dataset_versions' AND NOT t.tgisinternal
  ) THEN RAISE EXCEPTION 'Published versions need an immutability trigger'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='version_events' AND NOT t.tgisinternal
  ) THEN RAISE EXCEPTION 'Version CDC history needs an immutability trigger'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='prepared' AND c.relname='current_sales_state' AND NOT t.tgisinternal
  ) THEN RAISE EXCEPTION 'Version current state needs an immutability trigger'; END IF;
END $$;

INSERT INTO prepared.preparation_runs(
  tenant_id,pipeline_id,run_id,origin,status,actor_id,request_id,started_at,event_count
) VALUES (
  'demo-global','sql-contract','sql-contract-run','manual','published','contract-test','contract-test',clock_timestamp(),1
);
INSERT INTO prepared.dataset_versions(
  tenant_id,dataset_id,version_id,version_number,input_dataset_id,process_id,process_config,run_id,event_count
) VALUES (
  'demo-global','sql-contract','sql-contract-v1',1,'source-contract','process-contract','{}','sql-contract-run',1
);
INSERT INTO prepared.version_events(
  tenant_id,dataset_id,version_id,ordinal,source_event_id,business_key,operation,event_timestamp,after_image
) VALUES (
  'demo-global','sql-contract','sql-contract-v1',1,'sql-contract-event',1,'insert',clock_timestamp(),'{"sales_line_key":1}'::jsonb
);
INSERT INTO prepared.current_sales_state(
  tenant_id,dataset_id,version_id,business_key,after_image,last_event_id
) VALUES (
  'demo-global','sql-contract','sql-contract-v1',1,'{"sales_line_key":1}'::jsonb,'sql-contract-event'
);

DO $$
BEGIN
  BEGIN
    UPDATE prepared.dataset_versions SET event_count=2 WHERE dataset_id='sql-contract';
    RAISE EXCEPTION 'Published dataset version update was not rejected';
  EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;
  END;
  BEGIN
    DELETE FROM prepared.version_events WHERE source_event_id='sql-contract-event';
    RAISE EXCEPTION 'Published version event delete was not rejected';
  EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;
  END;
  BEGIN
    UPDATE prepared.current_sales_state SET last_event_id='changed' WHERE dataset_id='sql-contract';
    RAISE EXCEPTION 'Published current state update was not rejected';
  EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;
  END;
END $$;

SET LOCAL ROLE bi_prepared_writer;
SELECT set_config('app.tenant_id','demo-global',true);
INSERT INTO prepared.preparation_runs(
  tenant_id,pipeline_id,run_id,origin,status,actor_id,request_id,started_at
) VALUES (
  'demo-global','sql-contract','writer-tenant-run','manual','processing','contract-test','contract-test',clock_timestamp()
);
DO $$
BEGIN
  BEGIN
    INSERT INTO prepared.preparation_runs(
      tenant_id,pipeline_id,run_id,origin,status,actor_id,request_id,started_at
    ) VALUES (
      'demo-other','sql-contract','cross-tenant-run','manual','processing','contract-test','contract-test',clock_timestamp()
    );
    RAISE EXCEPTION 'Prepared writer crossed its tenant boundary';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
