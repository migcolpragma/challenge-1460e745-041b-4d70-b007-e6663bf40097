import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const poolSize = process.env.DATABASE_POOL_SIZE ?? '10';
    const connectTimeoutMs = Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? '10000');
    const connectTimeout = Math.floor(connectTimeoutMs / 1000);
    super({
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL}?connection_limit=${poolSize}&connect_timeout=${connectTimeout}`,
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected to database successfully');
    } catch (error) {
      this.logger.error('Failed to connect Prisma Client to database', (error as Error).stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Prisma Client disconnected from database successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Prisma Client', (error as Error).stack);
    }
  }
}
