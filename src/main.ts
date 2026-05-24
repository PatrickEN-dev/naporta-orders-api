import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

const PUBLIC_ROUTES = ['health', 'health/ready', 'docs'];
const SWAGGER_BEARER_NAME = 'access-token';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.flushLogs();

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  const trustProxy = config.get('TRUST_PROXY', { infer: true });
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true })),
    credentials: true,
  });
  app.setGlobalPrefix('v1', { exclude: PUBLIC_ROUTES });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(config.get('PORT', { infer: true }));
}

function parseCorsOrigins(raw: string): string[] | boolean {
  if (raw === '*') return true;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('naPorta Orders API')
    .setDescription('REST API for order management')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_BEARER_NAME)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
