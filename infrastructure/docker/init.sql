CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          VARCHAR(20) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  contract_address VARCHAR(56) UNIQUE NOT NULL,
  decimals        INT NOT NULL DEFAULT 7,
  logo_url        TEXT,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address VARCHAR(56) UNIQUE NOT NULL,
  pool_type       VARCHAR(30) NOT NULL CHECK (pool_type IN ('constant_product', 'stableswap', 'concentrated')),
  token0_id       UUID REFERENCES tokens(id),
  token1_id       UUID REFERENCES tokens(id),
  fee_bps         INT NOT NULL,
  tick_spacing    INT,
  amplification   NUMERIC(20,6),
  reserve0        NUMERIC(38,18) DEFAULT 0,
  reserve1        NUMERIC(38,18) DEFAULT 0,
  sqrt_price_x96  NUMERIC(80,0),
  current_tick    INT,
  tvl_usd         NUMERIC(28,8) DEFAULT 0,
  volume_24h_usd  NUMERIC(28,8) DEFAULT 0,
  fee_revenue_24h NUMERIC(28,8) DEFAULT 0,
  lp_count        INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pools_tokens ON pools(token0_id, token1_id, fee_bps);

SELECT create_hypertable('swaps', 'time', if_not_exists => TRUE);
SELECT create_hypertable('price_candles', 'time', if_not_exists => TRUE);
SELECT create_hypertable('tvl_snapshots', 'time', if_not_exists => TRUE);
