\set ON_ERROR_STOP on
SELECT version();
BEGIN;
DO $$
DECLARE actual numeric; expected numeric;
BEGIN
 IF (SELECT count(*) FROM gold.dim_tenant) <> 2 THEN RAISE EXCEPTION 'Expected 2 tenants'; END IF;
 IF (SELECT count(*) FROM gold.dim_date) <> 365 THEN RAISE EXCEPTION 'Expected 365 calendar days'; END IF;
 IF (SELECT count(*) FROM gold.fact_sales) <> 2160 THEN RAISE EXCEPTION 'Expected 2160 sale lines'; END IF;
 IF (SELECT count(*) FROM gold.fact_returns) <> 360 THEN RAISE EXCEPTION 'Expected 360 refund events'; END IF;
 IF (SELECT count(*) FROM gold.fact_sessions_daily) <> 180 THEN RAISE EXCEPTION 'Expected 180 session snapshots'; END IF;
 IF (SELECT count(*) FROM gold.fact_inventory_daily) <> 2160 THEN RAISE EXCEPTION 'Expected 2160 inventory snapshots'; END IF;

 SELECT sum(net_revenue) INTO actual FROM gold.v_revenue_daily;
 SELECT (SELECT sum(sale_amount) FROM gold.fact_sales) - (SELECT sum(refund_amount) FROM gold.fact_returns) INTO expected;
 IF actual <> expected THEN RAISE EXCEPTION 'Revenue fan-out or refund mismatch: % vs %',actual,expected; END IF;
 SELECT sum(net_revenue) INTO actual FROM gold.v_kpi_daily;
 IF actual <> expected THEN RAISE EXCEPTION 'Revenue changed on session join'; END IF;
 SELECT sum(net_cost) INTO actual FROM gold.v_kpi_daily;
 SELECT (SELECT sum(cost_amount) FROM gold.fact_sales) - (SELECT sum(cost_reversal_amount) FROM gold.fact_returns) INTO expected;
 IF actual <> expected THEN RAISE EXCEPTION 'Cost reconciliation failed'; END IF;
 SELECT sum(converting_sessions) INTO actual FROM gold.v_kpi_daily;
 SELECT sum(converting_sessions) INTO expected FROM gold.fact_sessions_daily;
 IF actual <> expected THEN RAISE EXCEPTION 'Session join duplicated numerator'; END IF;

 IF NOT EXISTS(SELECT 1 FROM gold.fact_returns GROUP BY tenant_id,sales_line_key HAVING count(*) > 1) THEN
   RAISE EXCEPTION 'Missing multiple-refund test case';
 END IF;
 IF EXISTS (
   SELECT 1 FROM gold.fact_returns r JOIN gold.fact_sales s USING (tenant_id,sales_line_key)
   GROUP BY r.tenant_id,r.sales_line_key,s.quantity,s.sale_amount,s.cost_amount
   HAVING sum(r.quantity)>s.quantity OR sum(r.refund_amount)>s.sale_amount OR sum(r.cost_reversal_amount)>s.cost_amount
 ) THEN RAISE EXCEPTION 'Returned quantity/value exceeds original sale'; END IF;

 SELECT sum(net_revenue) INTO actual FROM gold.v_revenue_daily WHERE tenant_id='demo-other';
 SELECT sum(net_revenue)*2 INTO expected FROM gold.v_revenue_daily WHERE tenant_id='demo-global';
 IF actual <> expected THEN RAISE EXCEPTION 'Expected deterministic 2x tenant scale'; END IF;
 IF (SELECT count(*) FROM gold.v_inventory_latest) <> 48 THEN RAISE EXCEPTION 'Expected latest snapshots only: 2*3*8'; END IF;
 IF (SELECT count(DISTINCT snapshot_date_key) FROM gold.v_inventory_latest) <> 1 THEN RAISE EXCEPTION 'Inventory has mixed dates'; END IF;
 IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='gold' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity) <> 10 THEN
   RAISE EXCEPTION 'All 10 tenant tables require forced RLS';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN ('bi_reader_global','bi_reader_other') AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls)) THEN
   RAISE EXCEPTION 'Reader has elevated privileges';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='gold' AND c.relkind='v' AND NOT ('security_invoker=true'=ANY(coalesce(c.reloptions,ARRAY[]::text[])))) THEN
   RAISE EXCEPTION 'A view bypasses invoker identity';
 END IF;
END $$;

-- Negative constraints are tested inside rolled-back subtransactions.
DO $$
BEGIN
 BEGIN
  INSERT INTO gold.fact_sessions_daily VALUES('demo-global',20260101,1,1,2);
  RAISE EXCEPTION 'Session constraint did not reject converted > eligible';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO gold.fact_returns(tenant_id,return_line_key,sales_line_key,return_date_key,reason_key,quantity,refund_amount,cost_reversal_amount)
  VALUES('demo-global',9999999,9999999,20260101,1,1,1,1);
  RAISE EXCEPTION 'Missing composite foreign key to original sale';
 EXCEPTION WHEN foreign_key_violation THEN NULL;
 END;
END $$;
ROLLBACK;

SELECT tenant_id, count(*) AS sales_lines, sum(sale_amount) AS sales_after_discount
FROM gold.fact_sales GROUP BY tenant_id ORDER BY tenant_id;
SELECT tenant_id, sum(net_revenue) AS net_revenue, sum(gross_profit) AS gross_profit,
       round(sum(gross_profit)/nullif(sum(net_revenue),0)*100,2) AS gross_margin_pct,
       sum(eligible_sessions) AS eligible_sessions, sum(converting_sessions) AS converting_sessions,
       round(sum(converting_sessions)::numeric/nullif(sum(eligible_sessions),0)*100,2) AS conversion_pct
FROM gold.v_kpi_daily GROUP BY tenant_id ORDER BY tenant_id;
\echo 'PASS: administrator reconciliation and constraints'
