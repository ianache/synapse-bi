\set ON_ERROR_STOP on
BEGIN;
INSERT INTO gold.dim_tenant VALUES
 ('demo-global', 'Comercio Global — ejemplo', 'PEN'),
 ('demo-other', 'Comercio Alterno — ejemplo', 'PEN');

INSERT INTO gold.dim_date
SELECT to_char(day, 'YYYYMMDD')::integer, day, extract(year FROM day),
       extract(quarter FROM day), extract(month FROM day), extract(day FROM day), extract(isodow FROM day)
FROM (SELECT DATE '2026-01-01' + n AS day FROM generate_series(0,364) n) dates;

INSERT INTO gold.dim_product
SELECT t.tenant_id, p, 'SKU-' || lpad(p::text,3,'0'), 'Producto ' || p,
       CASE WHEN p <= 4 THEN 'Tecnología' ELSE 'Hogar' END,
       CASE WHEN p % 2 = 0 THEN 'Marca Alfa' ELSE 'Marca Beta' END,
       (50 + p * 25) * CASE WHEN t.tenant_id = 'demo-global' THEN 1 ELSE 2 END,
       (50 + p * 25) * 0.60 * CASE WHEN t.tenant_id = 'demo-global' THEN 1 ELSE 2 END
FROM gold.dim_tenant t CROSS JOIN generate_series(1,8) p;

INSERT INTO gold.dim_customer
SELECT t.tenant_id, c, 'C-' || lpad(c::text,3,'0'), 'Cliente sintético ' || c,
       CASE WHEN c % 3 = 0 THEN 'Empresa' WHEN c % 3 = 1 THEN 'Frecuente' ELSE 'Ocasional' END,
       CASE WHEN c % 2 = 0 THEN 'Lima' ELSE 'Arequipa' END
FROM gold.dim_tenant t CROSS JOIN generate_series(1,40) c;

INSERT INTO gold.dim_store
SELECT t.tenant_id, s.store_key, s.code, s.name, s.region, s.kind
FROM gold.dim_tenant t CROSS JOIN (VALUES
 (1, 'WEB', 'Tienda en línea', 'Nacional', 'virtual'),
 (2, 'LIM', 'Tienda Lima', 'Lima', 'physical'),
 (3, 'AQP', 'Tienda Arequipa', 'Arequipa', 'physical')
) s(store_key,code,name,region,kind);

INSERT INTO gold.dim_channel
SELECT t.tenant_id, c.channel_key, c.name
FROM gold.dim_tenant t CROSS JOIN (VALUES (1,'Digital'),(2,'Tienda')) c(channel_key,name);

INSERT INTO gold.dim_return_reason
SELECT t.tenant_id, r.reason_key, r.name
FROM gold.dim_tenant t CROSS JOIN (VALUES (1,'Cambio de decisión'),(2,'Producto defectuoso')) r(reason_key,name);

WITH generated AS (
 SELECT t.tenant_id, d * 24 + (o - 1) * 2 + l AS line_id,
        'ORD-' || to_char(DATE '2026-09-01' + d,'YYYYMMDD') || '-' || lpad(o::text,3,'0') AS order_id,
        l AS line_number, to_char(DATE '2026-09-01' + d,'YYYYMMDD')::integer AS date_key,
        1 + ((o * 2 + l - 2) % 8) AS product_key,
        1 + ((d * 12 + o - 1) % 40) AS customer_key,
        CASE WHEN o % 2 = 1 THEN 1 WHEN o % 4 = 0 THEN 2 ELSE 3 END AS store_key,
        CASE WHEN o % 2 = 1 THEN 1 ELSE 2 END AS channel_key
 FROM gold.dim_tenant t CROSS JOIN generate_series(0,44) d
 CROSS JOIN generate_series(1,12) o CROSS JOIN generate_series(1,2) l
), priced AS (
 SELECT g.*, 1 + line_id % 3 AS quantity, p.reference_price, p.reference_cost
 FROM generated g JOIN gold.dim_product p USING (tenant_id,product_key)
)
INSERT INTO gold.fact_sales(tenant_id,sales_line_key,order_number,line_number,sale_date_key,
                           product_key,customer_key,store_key,channel_key,quantity,unit_price,discount_amount,cost_amount)
SELECT tenant_id, line_id, order_id, line_number, date_key, product_key, customer_key, store_key, channel_key,
       quantity, reference_price,
       round(quantity * reference_price * CASE WHEN line_id % 4 = 0 THEN 0.10 WHEN line_id % 7 = 0 THEN 0.05 ELSE 0 END,2),
       quantity * reference_cost
FROM priced;

-- Some original lines have two partial returns, deliberately exercising fan-out.
INSERT INTO gold.fact_returns(tenant_id,return_line_key,sales_line_key,return_date_key,reason_key,quantity,refund_amount,cost_reversal_amount)
SELECT s.tenant_id, s.sales_line_key * 10 + r.sequence, s.sales_line_key,
       to_char(d.full_date + CASE WHEN r.sequence = 1 THEN 1 ELSE 3 END, 'YYYYMMDD')::integer,
       r.sequence, 1, round(s.sale_amount / s.quantity,2), round(s.cost_amount / s.quantity,2)
FROM gold.fact_sales s JOIN gold.dim_date d ON d.date_key = s.sale_date_key
CROSS JOIN (VALUES (1),(2)) r(sequence)
WHERE s.sales_line_key % 10 = 0 AND (r.sequence = 1 OR s.quantity >= 2);

INSERT INTO gold.fact_sessions_daily
SELECT tenant_id, sale_date_key, channel_key,
       80 + (sale_date_key % 40) + channel_key * 15,
       count(DISTINCT order_number)
FROM gold.fact_sales GROUP BY tenant_id,sale_date_key,channel_key;

INSERT INTO gold.fact_inventory_daily(tenant_id,snapshot_date_key,store_key,product_key,on_hand_quantity,unit_cost)
SELECT p.tenant_id, to_char(DATE '2026-09-01' + d,'YYYYMMDD')::integer,
       s.store_key, p.product_key, 20 + (d * 3 + p.product_key * 7 + s.store_key) % 80, p.reference_cost
FROM gold.dim_product p JOIN gold.dim_store s USING (tenant_id)
CROSS JOIN generate_series(0,44) d;
COMMIT;
ANALYZE gold.fact_sales;
ANALYZE gold.fact_returns;
ANALYZE gold.fact_sessions_daily;
ANALYZE gold.fact_inventory_daily;
