import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pool } from './pool.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  symbol: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 56, name: 'contract_address' })
  contractAddress: string;

  @Column({ default: 7 })
  decimals: number;

  @Column({ nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Pool, (pool) => pool.token0)
  poolsAsToken0: Pool[];

  @OneToMany(() => Pool, (pool) => pool.token1)
  poolsAsToken1: Pool[];
}
