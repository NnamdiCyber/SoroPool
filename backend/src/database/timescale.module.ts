import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({})
export class TimescaleModule implements OnModuleInit {
  private readonly logger = new Logger(TimescaleModule.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureHypertables();
  }

  private async ensureHypertables() {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      const hypertables = [
        { name: 'swaps', timeColumn: 'time' },
        { name: 'price_candles', timeColumn: 'time' },
        { name: 'tvl_snapshots', timeColumn: 'time' },
      ];

      for (const ht of hypertables) {
        const exists = await queryRunner.query(
          `SELECT EXISTS(SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = $1)`,
          [ht.name],
        );
        if (!exists[0]?.exists) {
          try {
            await queryRunner.query(
              `SELECT create_hypertable('${ht.name}', '${ht.timeColumn}', if_not_exists => TRUE)`,
            );
            this.logger.log(`Created hypertable: ${ht.name}`);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes('already a hypertable')) {
              this.logger.warn(`Could not create hypertable ${ht.name}: ${msg}`);
            }
          }
        } else {
          this.logger.log(`Hypertable already exists: ${ht.name}`);
        }
      }
    } finally {
      await queryRunner.release();
    }
  }
}
