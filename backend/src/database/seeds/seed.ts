import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
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
  console.log('Seeded 5 tokens');

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

  await queryRunner.query(`
    INSERT INTO pools (contract_address, pool_type, token0_id, token1_id, fee_bps, tick_spacing, sqrt_price_x96, current_tick, reserve0, reserve1, tvl_usd, volume_24h_usd, fee_revenue_24h, lp_count, is_active)
    SELECT
      'CLPOOLDEMO1', 'concentrated', t0.id, t1.id, 5, 10, '452312848583266388373324160190187140051835877600158453279131187530910662656', -12345, '500000000', '2500000000', '15000', '3000', '10', 28, true
    FROM tokens t0, tokens t1
    WHERE t0.symbol = 'XLM' AND t1.symbol = 'USDC';
  `);
  console.log('Seeded 3 demo pools');

  // Demo LP positions
  const pools = await queryRunner.query(`SELECT id FROM pools`);
  const testWallet = 'GCVJZ4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6Z4Z6';

  for (const pool of pools) {
    await queryRunner.query(`
      INSERT INTO lp_positions (wallet_address, pool_id, lp_token_amount, token0_deposited, token1_deposited, token0_price_at_entry, fees_earned_token0, fees_earned_token1)
      VALUES ($1, $2, '500000000', '1000000', '5000000', '5.00000000', '5000', '25000')
      ON CONFLICT (wallet_address, pool_id) DO NOTHING;
    `, [testWallet, pool.id]);
  }
  console.log('Seeded LP positions');

  // Demo CL position
  const clPool = await queryRunner.query(`SELECT id FROM pools WHERE pool_type = 'concentrated' LIMIT 1`);
  if (clPool.length > 0) {
    await queryRunner.query(`
      INSERT INTO cl_positions (position_id, wallet_address, pool_id, tick_lower, tick_upper, liquidity, token0_owed, token1_owed, is_in_range)
      VALUES (1, $1, $2, -50000, 50000, '1000000000000', '250000', '1250000', true)
      ON CONFLICT (pool_id, position_id) DO NOTHING;
    `, [testWallet, clPool[0].id]);
  }
  console.log('Seeded CL positions');

  // Demo swap history
  const tokenIds = await queryRunner.query(`SELECT id, symbol FROM tokens`);
  const xlmId = tokenIds.find((t: any) => t.symbol === 'XLM')?.id;
  const usdcId = tokenIds.find((t: any) => t.symbol === 'USDC')?.id;
  const cpPool = await queryRunner.query(`SELECT id FROM pools WHERE pool_type = 'constant_product' LIMIT 1`);

  if (cpPool.length > 0 && xlmId && usdcId) {
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const time = new Date(now.getTime() - i * 30 * 60 * 1000);
      const amountIn = (1000000000 + Math.random() * 5000000000).toFixed(0);
      const amountOut = (5000000000 + Math.random() * 2000000000).toFixed(0);
      await queryRunner.query(`
        INSERT INTO swaps (time, pool_id, wallet_address, token_in_id, token_out_id, amount_in, amount_out, amount_in_usd, amount_out_usd, price_impact, fee_amount, tx_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (time, tx_hash) DO NOTHING;
      `, [
        time, cpPool[0].id, testWallet, xlmId, usdcId,
        amountIn, amountOut,
        (Number(amountIn) / 10000000 * 0.12).toFixed(8),
        (Number(amountOut) / 10000000 * 0.12).toFixed(8),
        (Math.random() * 0.02).toFixed(8),
        (Number(amountIn) * 0.003).toFixed(0),
        `tx${i.toString().padStart(8, '0')}`,
      ]);
    }
  }
  console.log('Seeded 50 swap history records');

  await queryRunner.release();
  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch(console.error);
