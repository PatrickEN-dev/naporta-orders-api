import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { Env } from '../../config/env.schema';

const SOFT_DELETE_MODELS = new Set(['User', 'Order']);

function withSoftDelete(client: PrismaClient) {
  const inject = (args: { where?: object } | undefined) => ({
    ...(args ?? {}),
    where: { ...(args?.where ?? {}), deletedAt: null },
  });
  return client.$extends({
    name: 'soft-delete',
    query: {
      $allModels: {
        findUnique: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
        findFirst: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
        findMany: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
        count: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
        update: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
        updateMany: ({ model, args, query }) =>
          query(SOFT_DELETE_MODELS.has(model) ? (inject(args) as typeof args) : args),
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof withSoftDelete>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: ExtendedPrismaClient;
  readonly base: PrismaClient;
  private readonly pingTimeoutMs: number;

  constructor(@Inject(ConfigService) config: ConfigService<Env, true>) {
    this.base = new PrismaClient({ log: ['error', 'warn'] });
    this.db = withSoftDelete(this.base);
    this.pingTimeoutMs = config.get('DB_PING_TIMEOUT_MS', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    await this.base.$connect();
    await this.ensureSequences();
  }

  async onModuleDestroy(): Promise<void> {
    await this.base.$disconnect();
  }

  async ping(): Promise<void> {
    const result = this.base.$queryRaw`SELECT 1`;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('database ping timed out')), this.pingTimeoutMs),
    );
    await Promise.race([result, timeout]);
  }

  private async ensureSequences(): Promise<void> {
    await this.base.$executeRawUnsafe('CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1');
  }
}
