import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { buildPinoConfig } from './pino-logger.config';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildPinoConfig,
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
