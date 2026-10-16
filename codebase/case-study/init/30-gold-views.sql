\set ON_ERROR_STOP on
BEGIN;
-- Security-invoker views preserve the reader's RLS identity on underlying tables.
CREATE VIEW gold.v_revenue_movements WITH (security_invoker = true) AS
SELECT s.tenant_id, s.sale_date_key AS date_key, s.channel_key, s.product_key,
       s.gross_amount AS gross_sales_amount, s.discount_amount,
       0::numeric(16,2) AS refund_amount, s.sale_amount AS net_revenue,
       s.cost_amount AS net_cost
FROM gold.fact_sales s
UNION ALL
SELECT r.tenant_id, r.return_date_key, s.channel_key, s.product_key,
       0::numeric(16,2), 0::numeric(16,2), r.refund_amount,
       -r.refund_amount, -r.cost_reversal_amount
FROM gold.fact_returns r JOIN gold.fact_sales s
  ON s.tenant_id = r.tenant_id AND s.sales_line_key = r.sales_line_key;
COMMENT ON VIEW gold.v_revenue_movements IS 'Signed event ledger. A refund affects the return date, not the original sale date; no tax/shipping/FX.';

CREATE VIEW gold.v_revenue_daily WITH (security_invoker = true) AS
SELECT tenant_id,date_key,channel_key,product_key,
       sum(gross_sales_amount) AS gross_sales_amount,
       sum(discount_amount) AS discount_amount,
       sum(refund_amount) AS refund_amount,
       sum(net_revenue) AS net_revenue,
       sum(net_cost) AS net_cost
FROM gold.v_revenue_movements GROUP BY tenant_id,date_key,channel_key,product_key;

CREATE VIEW gold.v_kpi_daily WITH (security_invoker = true) AS
WITH revenue AS (
 SELECT tenant_id,date_key,channel_key,sum(net_revenue) AS net_revenue,sum(net_cost) AS net_cost
 FROM gold.v_revenue_daily GROUP BY tenant_id,date_key,channel_key
)
SELECT coalesce(r.tenant_id,s.tenant_id) AS tenant_id,
       coalesce(r.date_key,s.session_date_key) AS date_key,
       coalesce(r.channel_key,s.channel_key) AS channel_key,
       coalesce(r.net_revenue,0) AS net_revenue,
       coalesce(r.net_cost,0) AS net_cost,
       coalesce(r.net_revenue,0)-coalesce(r.net_cost,0) AS gross_profit,
       round((r.net_revenue-r.net_cost) / nullif(r.net_revenue,0)*100,2) AS gross_margin_pct,
       coalesce(s.eligible_sessions,0) AS eligible_sessions,
       coalesce(s.converting_sessions,0) AS converting_sessions,
       round(s.converting_sessions::numeric/nullif(s.eligible_sessions,0)*100,2) AS conversion_pct
FROM revenue r FULL JOIN gold.fact_sessions_daily s
 ON r.tenant_id=s.tenant_id AND r.date_key=s.session_date_key AND r.channel_key=s.channel_key;
COMMENT ON VIEW gold.v_kpi_daily IS 'Day/channel grain. Aggregate monetary components and session counts before calculating ratios; do not average percentages.';

CREATE VIEW gold.v_inventory_latest WITH (security_invoker = true) AS
SELECT i.* FROM gold.fact_inventory_daily i
WHERE i.snapshot_date_key = (
 SELECT max(other.snapshot_date_key) FROM gold.fact_inventory_daily other WHERE other.tenant_id=i.tenant_id
);

-- Roles have no memberships and cannot switch to the other tenant's identity.
-- No client-controlled app.tenant_id GUC is trusted for access decisions.
DO $$
DECLARE table_name text;
BEGIN
 FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname='gold' AND tablename NOT IN ('dim_date','case_study_manifest') LOOP
   EXECUTE format('ALTER TABLE gold.%I ENABLE ROW LEVEL SECURITY',table_name);
   EXECUTE format('ALTER TABLE gold.%I FORCE ROW LEVEL SECURITY',table_name);
   EXECUTE format($policy$
     CREATE POLICY tenant_reader ON gold.%I FOR SELECT TO bi_reader_global,bi_reader_other
     USING (tenant_id = CASE current_user WHEN 'bi_reader_global' THEN 'demo-global' WHEN 'bi_reader_other' THEN 'demo-other' END)
   $policy$,table_name);
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA gold TO bi_reader_global,bi_reader_other;
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO bi_reader_global,bi_reader_other;
-- Deliberately no default grant: future tables must have security reviewed first.
COMMIT;
