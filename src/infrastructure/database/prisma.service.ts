import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

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
