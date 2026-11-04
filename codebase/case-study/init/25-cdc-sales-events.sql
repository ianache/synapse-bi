\set ON_ERROR_STOP on
BEGIN;
CREATE TABLE gold.cdc_sales_events (
    capture_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    source_event_id text NOT NULL,
    business_key bigint NOT NULL,
    operation text NOT NULL CHECK (operation IN ('insert','update','delete')),
    event_timestamp timestamptz NOT NULL,
    source_position bigint,
    after_image jsonb,
    UNIQUE (tenant_id, source_event_id),
    CHECK (
      (operation = 'delete' AND after_image IS NULL) OR
      (operation IN ('insert','update') AND jsonb_typeof(after_image) = 'object')
    )
);
COMMENT ON TABLE gold.cdc_sales_events IS 'Synthetic append-only CDC feed for sales lines. capture_id is a polling cursor, not event ordering.';
CREATE INDEX cdc_sales_events_poll ON gold.cdc_sales_events(tenant_id,capture_id);
CREATE INDEX cdc_sales_events_order ON gold.cdc_sales_events(tenant_id,source_position,event_timestamp);

CREATE FUNCTION gold.reject_cdc_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'CDC source history is append-only' USING ERRCODE='55000';
END $$;
CREATE TRIGGER cdc_sales_events_append_only
BEFORE UPDATE OR DELETE ON gold.cdc_sales_events
FOR EACH ROW EXECUTE FUNCTION gold.reject_cdc_mutation();

-- Every Gold sale line receives a deterministic insert event and full after-image.
WITH ordered_sales AS (
  SELECT s.*, row_number() OVER (PARTITION BY tenant_id ORDER BY loaded_at,sales_line_key) AS position
  FROM gold.fact_sales s
)
INSERT INTO gold.cdc_sales_events(tenant_id,source_event_id,business_key,operation,event_timestamp,source_position,after_image)
SELECT tenant_id, 'seed-insert-'||tenant_id||'-'||sales_line_key, sales_line_key, 'insert',
       loaded_at, position,
       jsonb_build_object(
         'tenant_id',tenant_id,'sales_line_key',sales_line_key,'order_number',order_number,
         'line_number',line_number,'sale_date_key',sale_date_key,'product_key',product_key,
         'customer_key',customer_key,'store_key',store_key,'channel_key',channel_key,
         'quantity',quantity,'unit_price',unit_price,'gross_amount',gross_amount,
         'discount_amount',discount_amount,'sale_amount',sale_amount,'cost_amount',cost_amount,'loaded_at',loaded_at
       )
FROM ordered_sales;

-- A small deterministic subset exercises full-image changes without altering Gold.
WITH changed_sales AS (
  SELECT s.*, row_number() OVER (PARTITION BY tenant_id ORDER BY sales_line_key) AS event_number
  FROM gold.fact_sales s WHERE sales_line_key % 100 = 0
)
INSERT INTO gold.cdc_sales_events(tenant_id,source_event_id,business_key,operation,event_timestamp,source_position,after_image)
SELECT tenant_id,'seed-update-'||tenant_id||'-'||sales_line_key,sales_line_key,'update',
       loaded_at + interval '1 day',2000000 + event_number,
       jsonb_build_object(
         'tenant_id',tenant_id,'sales_line_key',sales_line_key,'order_number',order_number,
         'line_number',line_number,'sale_date_key',sale_date_key,'product_key',product_key,
         'customer_key',customer_key,'store_key',store_key,'channel_key',channel_key,
         'quantity',quantity + 1,'unit_price',unit_price,'gross_amount',(quantity + 1)*unit_price,
         'discount_amount',discount_amount,'sale_amount',(quantity + 1)*unit_price-discount_amount,
         'cost_amount',cost_amount + cost_amount/quantity,'loaded_at',loaded_at + interval '1 day'
       )
FROM changed_sales;

-- A separate subset exercises deletes; deletion remains only in CDC history.
WITH deleted_sales AS (
  SELECT s.*, row_number() OVER (PARTITION BY tenant_id ORDER BY sales_line_key) AS event_number
  FROM gold.fact_sales s WHERE sales_line_key % 100 = 1
)
INSERT INTO gold.cdc_sales_events(tenant_id,source_event_id,business_key,operation,event_timestamp,source_position,after_image)
SELECT tenant_id,'seed-delete-'||tenant_id||'-'||sales_line_key,sales_line_key,'delete',
       loaded_at + interval '2 days',3000000 + event_number,NULL
FROM deleted_sales;
COMMIT;
