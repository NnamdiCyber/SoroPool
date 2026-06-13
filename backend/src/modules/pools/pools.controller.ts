import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PoolsService } from './pools.service';
import { PoolFactoryService } from './pool-factory.service';
import { CreatePoolDto } from './dto/create-pool.dto';

@ApiTags('pools')
@Controller('pools')
export class PoolsController {
  constructor(
    private readonly poolsService: PoolsService,
    private readonly poolFactoryService: PoolFactoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all pools with filters and pagination' })
  findAll(
    @Query('poolType') poolType?: string,
    @Query('tokenA') tokenA?: string,
    @Query('tokenB') tokenB?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.poolsService.findAll({ poolType, tokenA, tokenB }, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pool details' })
  findById(@Param('id') id: string) {
    return this.poolsService.findById(id);
  }

  @Get(':id/reserves')
  @ApiOperation({ summary: 'Get pool reserves' })
  async getReserves(@Param('id') id: string) {
    const pool = await this.poolsService.findById(id);
    return { reserve0: pool?.reserve0, reserve1: pool?.reserve1 };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get pool statistics' })
  async getStats(@Param('id') id: string) {
    return this.poolsService.getPoolStats(id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Build pool creation transaction' })
  async createPool(@Body() createPoolDto: CreatePoolDto) {
    return this.poolFactoryService.buildCreatePoolTx(createPoolDto);
  }
}
