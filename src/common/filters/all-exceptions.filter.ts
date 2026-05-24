import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { DomainError } from '../../shared/errors/domain.error';
import type { RequestWithId } from '../http/request-with-id';

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

interface ErrorResponse {
  status: number;
  payload: ErrorPayload;
}

const STATUS_CODES: Readonly<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.id ?? randomUUID();

    const { status, payload } = this.toErrorResponse(exception, requestId);

    if (status >= 500) {
      this.logger.error({ err: exception, requestId }, payload.message);
    } else {
      this.logger.warn({ err: serializeError(exception), requestId }, payload.message);
    }

    response.status(status).json({ error: payload });
  }

  private toErrorResponse(exception: unknown, requestId: string): ErrorResponse {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        payload: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          requestId,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const { message, details } = parseHttpException(exception);
      return {
        status,
        payload: { code: codeFromStatus(status), message, details, requestId },
      };
    }

    return {
      status: 500,
      payload: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId },
    };
  }
}

function codeFromStatus(status: number): string {
  return STATUS_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}

function parseHttpException(exception: HttpException): { message: string; details?: unknown } {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { message: response };
  }

  if (!isObject(response)) {
    return { message: exception.message };
  }

  const { message, error } = response as { message?: unknown; error?: unknown };

  if (Array.isArray(message)) {
    return { message: String(message[0] ?? exception.message), details: message };
  }
  if (typeof message === 'string') {
    return { message };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: exception.message };
}

function serializeError(exception: unknown): Record<string, unknown> {
  if (exception instanceof Error) {
    return { name: exception.name, message: exception.message };
  }
  return { value: String(exception) };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
