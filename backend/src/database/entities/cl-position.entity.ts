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

@Entity('cl_positions')
@Unique(['poolId', 'positionId'])
export class ClPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', name: 'position_id' })
  positionId: number;

  @Column({ length: 56, name: 'wallet_address' })
  walletAddress: string;

  @ManyToOne(() => Pool)
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @Column({ name: 'pool_id' })
  poolId: string;

  @Column({ name: 'tick_lower' })
  tickLower: number;

  @Column({ name: 'tick_upper' })
  tickUpper: number;

  @Column({ type: 'decimal', precision: 38, scale: 0, default: '0' })
  liquidity: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'token0_owed' })
  token0Owed: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'token1_owed' })
  token1Owed: string;

  @Column({ default: true, name: 'is_in_range' })
  isInRange: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
