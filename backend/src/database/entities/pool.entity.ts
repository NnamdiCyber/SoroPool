import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Token } from './token.entity';

@Entity('pools')
export class Pool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 56, name: 'contract_address' })
  contractAddress: string;

  @Column({ length: 30, name: 'pool_type' })
  poolType: string;

  @ManyToOne(() => Token)
  @JoinColumn({ name: 'token0_id' })
  token0: Token;

  @Column({ name: 'token0_id' })
  token0Id: string;

  @ManyToOne(() => Token)
  @JoinColumn({ name: 'token1_id' })
  token1: Token;

  @Column({ name: 'token1_id' })
  token1Id: string;

  @Column({ name: 'fee_bps' })
  feeBps: number;

  @Column({ nullable: true, name: 'tick_spacing' })
  tickSpacing: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  amplification: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0' })
  reserve0: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0' })
  reserve1: string;

  @Column({ type: 'decimal', precision: 80, scale: 0, nullable: true, name: 'sqrt_price_x96' })
  sqrtPriceX96: string;

  @Column({ nullable: true, name: 'current_tick' })
  currentTick: number;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: '0', name: 'tvl_usd' })
  tvlUsd: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: '0', name: 'volume_24h_usd' })
  volume24hUsd: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: '0', name: 'fee_revenue_24h' })
  feeRevenue24h: string;

  @Column({ default: 0, name: 'lp_count' })
  lpCount: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
