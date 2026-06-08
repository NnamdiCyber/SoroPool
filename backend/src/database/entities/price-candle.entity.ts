import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('price_candles')
export class PriceCandle {
  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @PrimaryColumn({ name: 'pool_id' })
  poolId: string;

  @PrimaryColumn({ length: 10 })
  interval: string;

  @Column({ type: 'decimal', precision: 28, scale: 8 })
  open: string;

  @Column({ type: 'decimal', precision: 28, scale: 8 })
  high: string;

  @Column({ type: 'decimal', precision: 28, scale: 8 })
  low: string;

  @Column({ type: 'decimal', precision: 28, scale: 8 })
  close: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'volume_token0' })
  volumeToken0: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'volume_token1' })
  volumeToken1: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: '0', name: 'volume_usd' })
  volumeUsd: string;

  @Column({ default: 0, name: 'tx_count' })
  txCount: number;
}
