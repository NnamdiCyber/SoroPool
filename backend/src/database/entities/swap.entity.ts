import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pool } from './pool.entity';
import { Token } from './token.entity';

@Entity('swaps')
export class Swap {
  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @PrimaryColumn({ length: 64, name: 'tx_hash' })
  txHash: string;

  @ManyToOne(() => Pool)
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  poolId: string;

  @Column({ length: 56, nullable: true, name: 'wallet_address' })
  walletAddress: string;

  @ManyToOne(() => Token)
  @JoinColumn({ name: 'token_in_id' })
  tokenIn: Token;

  @Column({ name: 'token_in_id' })
  tokenInId: string;

  @ManyToOne(() => Token)
  @JoinColumn({ name: 'token_out_id' })
  tokenOut: Token;

  @Column({ name: 'token_out_id' })
  tokenOutId: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, name: 'amount_in' })
  amountIn: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, name: 'amount_out' })
  amountOut: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, nullable: true, name: 'amount_in_usd' })
  amountInUsd: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, nullable: true, name: 'amount_out_usd' })
  amountOutUsd: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'price_impact' })
  priceImpact: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, nullable: true, name: 'fee_amount' })
  feeAmount: string;
}
