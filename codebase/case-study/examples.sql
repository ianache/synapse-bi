-- Execute as bi_reader_global or bi_reader_other: no tenant filter is needed
-- for isolation, because database RLS derives the tenant from the login role.
-- These are study queries, not approved business semantic contracts.

-- Net revenue and weighted ratios by calendar month and channel.
SELECT d.year_number,d.month_number,c.channel_name,
       sum(k.net_revenue) AS net_revenue_pen,
       sum(k.gross_profit) AS gross_profit_pen,
       round(sum(k.gross_profit)/nullif(sum(k.net_revenue),0)*100,2) AS gross_margin_pct,
       round(sum(k.converting_sessions)::numeric/nullif(sum(k.eligible_sessions),0)*100,2) AS conversion_pct
FROM gold.v_kpi_daily k
JOIN gold.dim_date d USING (date_key)
JOIN gold.dim_channel c USING (tenant_id,channel_key)
WHERE d.full_date BETWEEN DATE '2026-09-01' AND DATE '2026-10-18'
GROUP BY d.year_number,d.month_number,c.channel_name
ORDER BY d.year_number,d.month_number,c.channel_name;

-- Revenue by product: refunds are aggregated before they reach this view.
SELECT p.sku,p.product_name,p.category_name,sum(r.net_revenue) AS net_revenue_pen
FROM gold.v_revenue_daily r
JOIN gold.dim_product p USING (tenant_id,product_key)
GROUP BY p.sku,p.product_name,p.category_name ORDER BY net_revenue_pen DESC;

-- Latest stock: do not add daily balances across time.
SELECT s.store_name,p.product_name,i.on_hand_quantity,i.stock_value
FROM gold.v_inventory_latest i
JOIN gold.dim_store s USING (tenant_id,store_key)
JOIN gold.dim_product p USING (tenant_id,product_key)
ORDER BY s.store_name,p.product_name;

-- Schema discovery for the first source-connector story.
SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns WHERE table_schema='gold'
ORDER BY table_name,ordinal_position;
