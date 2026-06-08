import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PoolsService } from './pools.service';

@ApiTags('pools')
@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  @ApiOperation({ summary: 'List all pools' })
  findAll(
    @Query('poolType') poolType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.poolsService.findAll({ poolType }, { page, limit });
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
}
