import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsService } from './pools.service';
import { PoolsController } from './pools.controller';
import { PoolsGateway } from './pools.gateway';
import { PoolFactoryService } from './pool-factory.service';
import { Pool } from '../../database/entities/pool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pool])],
  controllers: [PoolsController],
  providers: [PoolsService, PoolsGateway, PoolFactoryService],
  exports: [PoolsService],
})
export class PoolsModule {}
