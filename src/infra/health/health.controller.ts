import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  type HealthCheckResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import type { Env } from '../../config/env.schema';
import { PrismaHealthIndicator } from './prisma.health';

const BYTES_PER_MB = 1024 * 1024;

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly heapLimitBytes: number;

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    config: ConfigService<Env, true>,
  ) {
    this.heapLimitBytes = config.get('MEMORY_HEAP_LIMIT_MB', { infer: true }) * BYTES_PER_MB;
  }

  @Get()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.memory.checkHeap('memory_heap', this.heapLimitBytes)]);
  }

  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', this.heapLimitBytes),
      () => this.prisma.isHealthy(),
    ]);
  }
}
