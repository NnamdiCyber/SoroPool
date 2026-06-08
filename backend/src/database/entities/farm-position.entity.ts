import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('farm_positions')
@Unique(['walletAddress', 'poolId'])
export class FarmPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 56, name: 'wallet_address' })
  walletAddress: string;

  @Column({ name: 'pool_id' })
  poolId: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'lp_amount_staked' })
  lpAmountStaked: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'reward_debt' })
  rewardDebt: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'pending_rewards' })
  pendingRewards: string;

  @Column({ type: 'decimal', precision: 38, scale: 18, default: '0', name: 'total_harvested' })
  totalHarvested: string;

  @Column({ nullable: true, name: 'deposited_at' })
  depositedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
