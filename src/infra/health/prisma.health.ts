import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indicator: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'database'): Promise<HealthIndicatorResult> {
    const session = this.indicator.check(key);
    try {
      await this.prisma.ping();
      return session.up();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      return session.down({ message });
    }
  }
}
