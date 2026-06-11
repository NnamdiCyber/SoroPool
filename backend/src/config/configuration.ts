export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  wsPort: parseInt(process.env.WS_PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL_SECONDS || '300', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  routing: {
    maxHops: parseInt(process.env.MAX_HOPS || '3', 10),
    maxRoutes: parseInt(process.env.MAX_ROUTES_CONSIDERED || '20', 10),
    cacheTtlMs: parseInt(process.env.ROUTING_CACHE_TTL_MS || '2000', 10),
  },
  indexer: {
    startLedger: parseInt(process.env.INDEXER_START_LEDGER || '1000000', 10),
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '100', 10),
    pollIntervalMs: parseInt(process.env.INDEXER_POLL_INTERVAL_MS || '5000', 10),
  },
  oracle: {
    twapWindowSeconds: parseInt(process.env.TWAP_WINDOW_SECONDS || '1800', 10),
    refreshIntervalSec: parseInt(process.env.ORACLE_REFRESH_INTERVAL_SEC || '60', 10),
    maxPriceDeviationPct: parseInt(process.env.MAX_PRICE_DEVIATION_PCT || '5', 10),
  },
  notifications: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@soropool.finance',
  },
});
