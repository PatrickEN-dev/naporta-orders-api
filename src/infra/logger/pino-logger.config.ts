import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.email',
  'req.body.customerDocument',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
] as const;

const PRETTY_OPTIONS = {
  translateTime: 'SYS:standard',
  singleLine: true,
  colorize: true,
  ignore: 'pid,hostname,req.headers,res.headers',
} as const;

export function buildPinoConfig(config: ConfigService<Env, true>): Params {
  const isProd = config.get('NODE_ENV', { infer: true }) === 'production';

  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      transport: isProd ? undefined : { target: 'pino-pretty', options: PRETTY_OPTIONS },
      redact: { paths: [...REDACTED_PATHS], remove: false },
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      genReqId: (req: IncomingMessage) => {
        const incoming = req.headers['x-request-id'];
        return typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
      },
      customProps: () => ({ context: 'HTTP' }),
    },
  };
}
