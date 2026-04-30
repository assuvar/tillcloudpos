import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit() {
    try {
      console.log('[Prisma] Attempting to connect to database...');
      await this.$connect();
      console.log('[Prisma] Database connection established successfully.');
    } catch (error) {
      console.error(
        '[Prisma] CRITICAL: Failed to connect to database on startup.',
      );
      console.error(`[Prisma] Error: ${error.message}`);
      console.error(
        '[Prisma] The app will continue running but DB features will fail until connection is restored.',
      );
      // We don't re-throw here to prevent the whole NestJS app from crashing
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
