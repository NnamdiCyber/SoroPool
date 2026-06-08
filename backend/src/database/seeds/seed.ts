import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    database: process.env.DATABASE_NAME || 'soropool',
    username: process.env.DATABASE_USER || 'soropool',
    password: process.env.DATABASE_PASSWORD || 'soropool',
    entities: ['src/database/entities/*.entity.ts'],
  });

  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  // Tokens
  await queryRunner.query(`
    INSERT INTO tokens (symbol, name, contract_address, decimals, is_verified) VALUES
      ('XLM', 'Stellar Lumens', 'CAS3J7GYLGXMF6WDJ3T5QV6Y3HDSN7Z3KZ4X7Z6X7Z6X7Z6X7Z6X7Z6', 7, true),
      ('USDC', 'USD Coin', 'CAS3J7GYLGXMF6WDJ3T5QV6Y3HDSN7Z3KZ4X7Z6X7Z6X7Z6X7Z6X7Z7', 7, true),
      ('USDT', 'Tether USD', 'CAS3J7GYLGXMF6WDJ3T5QV6Y3HDSN7Z3KZ4X7Z6X7Z6X7Z6X7Z6X7Z8', 7, true),
      ('BTC', 'Wrapped Bitcoin', 'CAS3J7GYLGXMF6WDJ3T5QV6Y3HDSN7Z3KZ4X7Z6X7Z6X7Z6X7Z6X7Z9', 7, true),
      ('ETH', 'Wrapped Ethereum', 'CAS3J7GYLGXMF6WDJ3T5QV6Y3HDSN7Z3KZ4X7Z6X7Z6X7Z6X7Z6X7ZA', 7, true)
    ON CONFLICT (symbol) DO NOTHING;
  `);

  console.log('Seeded tokens');

  // Demo pools
  await queryRunner.query(`
    INSERT INTO pools (contract_address, pool_type, token0_id, token1_id, fee_bps, reserve0, reserve1, tvl_usd, volume_24h_usd, fee_revenue_24h, lp_count, is_active)
    SELECT
      'CPOOLDEMO1', 'constant_product', t0.id, t1.id, 30, '1000000000', '5000000000', '25000', '5000', '15', 42, true
    FROM tokens t0, tokens t1
    WHERE t0.symbol = 'XLM' AND t1.symbol = 'USDC';
  `);

  await queryRunner.query(`
    INSERT INTO pools (contract_address, pool_type, token0_id, token1_id, fee_bps, amplification, reserve0, reserve1, tvl_usd, volume_24h_usd, fee_revenue_24h, lp_count, is_active)
    SELECT
      'SPOOLDEMO1', 'stableswap', t0.id, t1.id, 5, '200.000000', '20000000000', '20000000000', '40000', '50000', '25', 120, true
    FROM tokens t0, tokens t1
    WHERE t0.symbol = 'USDC' AND t1.symbol = 'USDT';
  `);

  console.log('Seeded demo pools');

  await queryRunner.release();
  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch(console.error);
