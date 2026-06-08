import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Token } from './entities/token.entity';
import { Pool } from './entities/pool.entity';
import { LpPosition } from './entities/lp-position.entity';
import { ClPosition } from './entities/cl-position.entity';
import { Swap } from './entities/swap.entity';
import { PriceCandle } from './entities/price-candle.entity';
import { FarmPosition } from './entities/farm-position.entity';
import { TvlSnapshot } from './entities/tvl-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        database: config.get('database.name'),
        username: config.get('database.user'),
        password: config.get('database.password'),
        ssl: config.get('database.ssl'),
        poolSize: config.get('database.poolSize'),
        entities: [
          Token,
          Pool,
          LpPosition,
          ClPosition,
          Swap,
          PriceCandle,
          FarmPosition,
          TvlSnapshot,
        ],
        synchronize: false,
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
