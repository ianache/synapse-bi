\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA gold;
COMMENT ON SCHEMA gold IS 'Synthetic omnichannel retail study, model v1; not a corporate certified model.';

CREATE TABLE gold.dim_tenant (
    tenant_id text PRIMARY KEY,
    tenant_name text NOT NULL,
    currency_code char(3) NOT NULL DEFAULT 'PEN' CHECK (currency_code = 'PEN')
);

CREATE TABLE gold.dim_date (
    date_key integer PRIMARY KEY,
    full_date date NOT NULL UNIQUE,
    year_number smallint NOT NULL,
    quarter_number smallint NOT NULL CHECK (quarter_number BETWEEN 1 AND 4),
    month_number smallint NOT NULL CHECK (month_number BETWEEN 1 AND 12),
    day_of_month smallint NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    iso_day_of_week smallint NOT NULL CHECK (iso_day_of_week BETWEEN 1 AND 7)
);

CREATE TABLE gold.dim_product (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    product_key integer NOT NULL,
    sku text NOT NULL,
    product_name text NOT NULL,
    category_name text NOT NULL,
    brand_name text NOT NULL,
    reference_price numeric(14,2) NOT NULL CHECK (reference_price > 0),
    reference_cost numeric(14,2) NOT NULL CHECK (reference_cost >= 0),
    PRIMARY KEY (tenant_id, product_key),
    UNIQUE (tenant_id, sku)
);

CREATE TABLE gold.dim_customer (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    customer_key integer NOT NULL,
    customer_code text NOT NULL,
    display_name text NOT NULL,
    segment_name text NOT NULL,
    region_name text NOT NULL,
    PRIMARY KEY (tenant_id, customer_key),
    UNIQUE (tenant_id, customer_code)
);

CREATE TABLE gold.dim_store (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    store_key integer NOT NULL,
    store_code text NOT NULL,
    store_name text NOT NULL,
    region_name text NOT NULL,
    store_type text NOT NULL CHECK (store_type IN ('virtual', 'physical')),
    PRIMARY KEY (tenant_id, store_key),
    UNIQUE (tenant_id, store_code)
);

CREATE TABLE gold.dim_channel (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    channel_key integer NOT NULL,
    channel_name text NOT NULL,
    PRIMARY KEY (tenant_id, channel_key),
    UNIQUE (tenant_id, channel_name)
);

CREATE TABLE gold.dim_return_reason (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    reason_key integer NOT NULL,
    reason_name text NOT NULL,
    PRIMARY KEY (tenant_id, reason_key)
);

CREATE TABLE gold.fact_sales (
    tenant_id text NOT NULL REFERENCES gold.dim_tenant,
    sales_line_key bigint NOT NULL,
    order_number text NOT NULL,
    line_number smallint NOT NULL CHECK (line_number > 0),
    sale_date_key integer NOT NULL REFERENCES gold.dim_date,
    product_key integer NOT NULL,
    customer_key integer NOT NULL,
    store_key integer NOT NULL,
    channel_key integer NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
    gross_amount numeric(16,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount numeric(16,2) NOT NULL CHECK (discount_amount >= 0),
    sale_amount numeric(16,2) GENERATED ALWAYS AS (quantity * unit_price - discount_amount) STORED,
    cost_amount numeric(16,2) NOT NULL CHECK (cost_amount >= 0),
    loaded_at timestamptz NOT NULL DEFAULT TIMESTAMPTZ '2026-10-16 00:00:00+00',
    PRIMARY KEY (tenant_id, sales_line_key),
    UNIQUE (tenant_id, order_number, line_number),
    CHECK (discount_amount <= quantity * unit_price),
    FOREIGN KEY (tenant_id, product_key) REFERENCES gold.dim_product,
    FOREIGN KEY (tenant_id, customer_key) REFERENCES gold.dim_customer,
    FOREIGN KEY (tenant_id, store_key) REFERENCES gold.dim_store,
    FOREIGN KEY (tenant_id, channel_key) REFERENCES gold.dim_channel
);
COMMENT ON TABLE gold.fact_sales IS 'Grain: one completed order line. PEN, excluding tax and shipping. Returns are separate events.';

CREATE TABLE gold.fact_returns (
    tenant_id text NOT NULL,
    return_line_key bigint NOT NULL,
    sales_line_key bigint NOT NULL,
    return_date_key integer NOT NULL REFERENCES gold.dim_date,
    reason_key integer NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    refund_amount numeric(16,2) NOT NULL CHECK (refund_amount >= 0),
    cost_reversal_amount numeric(16,2) NOT NULL CHECK (cost_reversal_amount >= 0),
    loaded_at timestamptz NOT NULL DEFAULT TIMESTAMPTZ '2026-10-18 00:00:00+00',
    PRIMARY KEY (tenant_id, return_line_key),
    FOREIGN KEY (tenant_id, sales_line_key) REFERENCES gold.fact_sales,
    FOREIGN KEY (tenant_id, reason_key) REFERENCES gold.dim_return_reason
);
COMMENT ON TABLE gold.fact_returns IS 'Grain: one refund event against one original sales line; several partial returns per sales line are allowed.';

CREATE TABLE gold.fact_sessions_daily (
    tenant_id text NOT NULL,
    session_date_key integer NOT NULL REFERENCES gold.dim_date,
    channel_key integer NOT NULL,
    eligible_sessions integer NOT NULL CHECK (eligible_sessions >= 0),
    converting_sessions integer NOT NULL CHECK (converting_sessions >= 0 AND converting_sessions <= eligible_sessions),
    PRIMARY KEY (tenant_id, session_date_key, channel_key),
    FOREIGN KEY (tenant_id, channel_key) REFERENCES gold.dim_channel
);
COMMENT ON TABLE gold.fact_sessions_daily IS 'Grain: day/channel/tenant. In this synthetic study each converted session generates one order.';

CREATE TABLE gold.fact_inventory_daily (
    tenant_id text NOT NULL,
    snapshot_date_key integer NOT NULL REFERENCES gold.dim_date,
    store_key integer NOT NULL,
    product_key integer NOT NULL,
    on_hand_quantity integer NOT NULL CHECK (on_hand_quantity >= 0),
    unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
    stock_value numeric(16,2) GENERATED ALWAYS AS (on_hand_quantity * unit_cost) STORED,
    PRIMARY KEY (tenant_id, snapshot_date_key, store_key, product_key),
    FOREIGN KEY (tenant_id, store_key) REFERENCES gold.dim_store,
    FOREIGN KEY (tenant_id, product_key) REFERENCES gold.dim_product
);
COMMENT ON TABLE gold.fact_inventory_daily IS 'Grain: end-of-day/store/product/tenant snapshot. Balances must not be summed across dates.';

CREATE INDEX sales_date_channel ON gold.fact_sales(tenant_id, sale_date_key, channel_key);
CREATE INDEX sales_product_date ON gold.fact_sales(tenant_id, product_key, sale_date_key);
CREATE INDEX sales_customer ON gold.fact_sales(tenant_id, customer_key);
CREATE INDEX returns_original_line ON gold.fact_returns(tenant_id, sales_line_key);
CREATE INDEX returns_date ON gold.fact_returns(tenant_id, return_date_key);

-- This manifest contains no tenant data; it is the final initialization marker.
CREATE TABLE gold.case_study_manifest (
    version integer PRIMARY KEY,
    dataset_name text NOT NULL,
    data_kind text NOT NULL CHECK (data_kind = 'synthetic'),
    sales_start_date date NOT NULL,
    sales_end_date date NOT NULL,
    initialized_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
COMMIT;
