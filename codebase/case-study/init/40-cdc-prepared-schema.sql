\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA prepared;
COMMENT ON SCHEMA prepared IS 'Tenant-scoped immutable lab outputs derived from CDC; separate from Gold.';

CREATE TABLE prepared.preparation_runs (
    tenant_id text NOT NULL,
    pipeline_id text NOT NULL,
    run_id text NOT NULL,
    retry_of_run_id text,
    origin text NOT NULL CHECK (origin IN ('manual','poll')),
    status text NOT NULL CHECK (status IN ('received','processing','published','technical_failure','quality_rejected')),
    actor_id text NOT NULL,
    request_id text NOT NULL,
    started_at timestamptz NOT NULL,
    ended_at timestamptz,
    event_count integer NOT NULL DEFAULT 0 CHECK (event_count >= 0),
    insert_count integer NOT NULL DEFAULT 0 CHECK (insert_count >= 0),
    update_count integer NOT NULL DEFAULT 0 CHECK (update_count >= 0),
    delete_count integer NOT NULL DEFAULT 0 CHECK (delete_count >= 0),
    rejected_count integer NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
    quality_results jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(quality_results)='object'),
    source_range_start bigint,
    source_range_end bigint,
    published_version_id text,
    latest_successful_version_id text,
    error_code text,
    sanitized_error text,
    PRIMARY KEY (tenant_id,run_id),
    FOREIGN KEY (tenant_id,retry_of_run_id) REFERENCES prepared.preparation_runs(tenant_id,run_id),
    CHECK (source_range_end IS NULL OR source_range_start IS NULL OR source_range_end >= source_range_start)
);

CREATE TABLE prepared.pipeline_checkpoints (
    tenant_id text NOT NULL,
    pipeline_id text NOT NULL,
    capture_position bigint NOT NULL DEFAULT 0 CHECK (capture_position >= 0),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (tenant_id,pipeline_id)
);

CREATE TABLE prepared.dataset_versions (
    tenant_id text NOT NULL,
    dataset_id text NOT NULL,
    version_id text NOT NULL,
    version_number bigint NOT NULL CHECK (version_number > 0),
    input_dataset_id text NOT NULL,
    process_id text NOT NULL,
    process_config jsonb NOT NULL CHECK (jsonb_typeof(process_config)='object'),
    run_id text NOT NULL,
    source_range_start bigint,
    source_range_end bigint,
    event_count bigint NOT NULL CHECK (event_count >= 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (tenant_id,dataset_id,version_id),
    UNIQUE (tenant_id,dataset_id,version_number),
    FOREIGN KEY (tenant_id,run_id) REFERENCES prepared.preparation_runs(tenant_id,run_id),
    CHECK (source_range_end IS NULL OR source_range_start IS NULL OR source_range_end >= source_range_start)
);

CREATE TABLE prepared.version_events (
    tenant_id text NOT NULL,
    dataset_id text NOT NULL,
    version_id text NOT NULL,
    ordinal bigint NOT NULL CHECK (ordinal > 0),
    source_event_id text NOT NULL,
    business_key bigint NOT NULL,
    operation text NOT NULL CHECK (operation IN ('insert','update','delete')),
    event_timestamp timestamptz NOT NULL,
    source_position bigint,
    timestamp_ambiguous boolean NOT NULL DEFAULT false,
    after_image jsonb,
    PRIMARY KEY (tenant_id,dataset_id,version_id,ordinal),
    UNIQUE (tenant_id,dataset_id,version_id,source_event_id),
    FOREIGN KEY (tenant_id,dataset_id,version_id)
      REFERENCES prepared.dataset_versions(tenant_id,dataset_id,version_id),
    CHECK ((operation='delete' AND after_image IS NULL) OR
           (operation IN ('insert','update') AND jsonb_typeof(after_image)='object'))
);

CREATE TABLE prepared.current_sales_state (
    tenant_id text NOT NULL,
    dataset_id text NOT NULL,
    version_id text NOT NULL,
    business_key bigint NOT NULL,
    after_image jsonb NOT NULL CHECK (jsonb_typeof(after_image)='object'),
    last_event_id text NOT NULL,
    PRIMARY KEY (tenant_id,dataset_id,version_id,business_key),
    FOREIGN KEY (tenant_id,dataset_id,version_id)
      REFERENCES prepared.dataset_versions(tenant_id,dataset_id,version_id)
);

CREATE FUNCTION prepared.reject_version_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Published prepared versions are immutable' USING ERRCODE='55000';
END $$;
CREATE TRIGGER dataset_versions_immutable BEFORE UPDATE OR DELETE ON prepared.dataset_versions
FOR EACH ROW EXECUTE FUNCTION prepared.reject_version_mutation();
CREATE TRIGGER version_events_immutable BEFORE UPDATE OR DELETE ON prepared.version_events
FOR EACH ROW EXECUTE FUNCTION prepared.reject_version_mutation();
CREATE TRIGGER current_sales_state_immutable BEFORE UPDATE OR DELETE ON prepared.current_sales_state
FOR EACH ROW EXECUTE FUNCTION prepared.reject_version_mutation();

DO $$
DECLARE relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'preparation_runs','pipeline_checkpoints','dataset_versions','version_events','current_sales_state'
  ] LOOP
    EXECUTE format('ALTER TABLE prepared.%I ENABLE ROW LEVEL SECURITY',relation_name);
    EXECUTE format('ALTER TABLE prepared.%I FORCE ROW LEVEL SECURITY',relation_name);
    EXECUTE format($policy$
      CREATE POLICY tenant_scope ON prepared.%I
      USING (tenant_id = CASE current_user
        WHEN 'bi_reader_global' THEN 'demo-global'
        WHEN 'bi_reader_other' THEN 'demo-other'
        WHEN 'bi_prepared_writer' THEN nullif(current_setting('app.tenant_id',true),'')
        ELSE NULL END)
      WITH CHECK (tenant_id = CASE current_user
        WHEN 'bi_prepared_writer' THEN nullif(current_setting('app.tenant_id',true),'')
        ELSE NULL END)
    $policy$,relation_name);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA prepared TO bi_reader_global,bi_reader_other,bi_prepared_writer;
GRANT SELECT ON prepared.dataset_versions,prepared.version_events,prepared.current_sales_state
  TO bi_reader_global,bi_reader_other;
GRANT SELECT,INSERT,UPDATE ON prepared.preparation_runs,prepared.pipeline_checkpoints TO bi_prepared_writer;
GRANT SELECT,INSERT ON prepared.dataset_versions,prepared.version_events,prepared.current_sales_state
  TO bi_prepared_writer;
ALTER ROLE bi_prepared_writer SET statement_timeout='30s';
ALTER ROLE bi_prepared_writer SET search_path=pg_catalog,prepared;
COMMIT;
