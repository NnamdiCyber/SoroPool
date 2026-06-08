import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import stellarConfig from './config/stellar.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PoolsModule } from './modules/pools/pools.module';
import { SwapModule } from './modules/swap/swap.module';
import { RoutingModule } from './modules/routing/routing.module';
import { LiquidityModule } from './modules/liquidity/liquidity.module';
import { FarmModule } from './modules/farm/farm.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, databaseConfig, stellarConfig],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    PoolsModule,
    SwapModule,
    RoutingModule,
    LiquidityModule,
    FarmModule,
    OracleModule,
    IndexerModule,
    AnalyticsModule,
    NotificationsModule,
    GovernanceModule,
    AdminModule,
  ],
})
export class AppModule {}
