\set ON_ERROR_STOP on
SELECT current_user AS authenticated_reader, :'tenant' AS expected_tenant;
SELECT set_config('study.expected_tenant', :'tenant', false);
SELECT set_config('study.other_role', :'other_role', false);
-- This must not affect RLS: source context comes from the database identity.
SELECT set_config('app.tenant_id','forged-tenant',false);
DO $$
DECLARE table_name text; count_other bigint;
BEGIN
 IF current_setting('default_transaction_read_only') <> 'on' THEN RAISE EXCEPTION 'Reader is not read-only by default'; END IF;
 FOR table_name IN
   SELECT c.table_name FROM information_schema.columns c
   WHERE c.table_schema='gold' AND c.column_name='tenant_id'
 LOOP
   EXECUTE format('SELECT count(*) FROM gold.%I WHERE tenant_id <> $1',table_name)
   INTO count_other USING current_setting('study.expected_tenant');
   IF count_other <> 0 THEN RAISE EXCEPTION 'Cross-tenant rows exposed in %',table_name; END IF;
 END LOOP;
 IF (SELECT count(*) FROM gold.fact_sales) <> 1080 THEN RAISE EXCEPTION 'Reader should see 1080 sale lines'; END IF;
 IF (SELECT count(*) FROM gold.v_inventory_latest) <> 24 THEN RAISE EXCEPTION 'Reader should see 24 latest inventory rows'; END IF;
 IF (SELECT count(*) FROM information_schema.tables t WHERE t.table_schema='gold' AND t.table_name LIKE 'fact_%') <> 4 THEN
   RAISE EXCEPTION 'Reader must discover the four fact tables';
 END IF;
 IF has_schema_privilege(current_user,'gold','CREATE') OR has_database_privilege(current_user,current_database(),'CREATE') THEN
   RAISE EXCEPTION 'Reader can create objects';
 END IF;
 IF has_table_privilege(current_user,'gold.fact_sales','INSERT,UPDATE,DELETE') THEN
   RAISE EXCEPTION 'Reader has write privileges';
 END IF;
 BEGIN
   INSERT INTO gold.dim_tenant VALUES('forbidden','forbidden','PEN');
   RAISE EXCEPTION 'Reader unexpectedly wrote data';
 EXCEPTION WHEN insufficient_privilege OR read_only_sql_transaction THEN NULL;
 END;
 BEGIN
   EXECUTE format('SET ROLE %I',current_setting('study.other_role'));
   RAISE EXCEPTION 'Reader unexpectedly switched tenant roles';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT tenant_id,sum(net_revenue) AS visible_net_revenue FROM gold.v_kpi_daily GROUP BY tenant_id;
\echo 'PASS: authenticated reader isolation, discovery and read-only access'
