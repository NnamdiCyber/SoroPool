import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Pool } from './pool.entity';

@Entity('lp_positions')
@Unique(['walletAddress', 'poolId'])
export class LpPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 56, name: 'wallet_address' })
  walletAddress: string;

  @ManyToOne(() => Pool)
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  poolId: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'lp_token_amount' })
  lpTokenAmount: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'token0_deposited' })
  token0Deposited: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'token1_deposited' })
  token1Deposited: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, nullable: true, name: 'token0_price_at_entry' })
  token0PriceAtEntry: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'fees_earned_token0' })
  feesEarnedToken0: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'fees_earned_token1' })
  feesEarnedToken1: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
