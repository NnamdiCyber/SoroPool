import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pool } from './pool.entity';

@Entity('tvl_snapshots')
export class TvlSnapshot {
  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @ManyToOne(() => Pool)
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @PrimaryColumn({ name: 'pool_id' })
  poolId: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, name: 'tvl_usd' })
  tvlUsd: string;

  @Column({ type: 'decimal', precision: 38, scale: 18 })
  reserve0: string;

  @Column({ type: 'decimal', precision: 38, scale: 18 })
  reserve1: string;
}
