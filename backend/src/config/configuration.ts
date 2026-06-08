export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  wsPort: parseInt(process.env.WS_PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL_SECONDS, 10) || 300,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  routing: {
    maxHops: parseInt(process.env.MAX_HOPS, 10) || 3,
    maxRoutes: parseInt(process.env.MAX_ROUTES_CONSIDERED, 10) || 20,
    cacheTtlMs: parseInt(process.env.ROUTING_CACHE_TTL_MS, 10) || 2000,
  },
  indexer: {
    startLedger: parseInt(process.env.INDEXER_START_LEDGER, 10) || 1000000,
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE, 10) || 100,
    pollIntervalMs: parseInt(process.env.INDEXER_POLL_INTERVAL_MS, 10) || 5000,
  },
  oracle: {
    twapWindowSeconds: parseInt(process.env.TWAP_WINDOW_SECONDS, 10) || 1800,
    refreshIntervalSec: parseInt(process.env.ORACLE_REFRESH_INTERVAL_SEC, 10) || 60,
    maxPriceDeviationPct: parseInt(process.env.MAX_PRICE_DEVIATION_PCT, 10) || 5,
  },
  notifications: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@soropool.finance',
  },
});
