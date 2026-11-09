import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import type { ApiErrorBody } from '@shared/models/api.model';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
    readonly body: ApiErrorBody | null = null,
    readonly correlationId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get fieldErrors(): Readonly<Record<string, readonly string[]>> {
    return this.body?.errors ?? {};
  }

  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof TimeoutError) {
    return new ApiError('A requisição demorou demais para responder.', 'timeout');
  }

  if (error instanceof HttpErrorResponse) {
    const body = isApiErrorBody(error.error) ? error.error : null;
    const correlationId = error.headers.get('X-Correlation-Id');
    const message =
      body?.detail ??
      body?.title ??
      error.message ??
      'Não foi possível concluir a operação.';

    if (error.status === 0) {
      return new ApiError(
        'Não foi possível conectar à API. Verifique se o backend está em execução.',
        'network',
        null,
        body,
        correlationId,
      );
    }

    if (error.status === 400 || error.status === 422) {
      return new ApiError(message, 'validation', error.status, body, correlationId);
    }

    if (error.status === 404) {
      return new ApiError(message, 'not-found', error.status, body, correlationId);
    }

    if (error.status === 409) {
      return new ApiError(message, 'conflict', error.status, body, correlationId);
    }

    if (error.status >= 500) {
      return new ApiError(
        'O servidor encontrou um erro ao processar a solicitação.',
        'server',
        error.status,
        body,
        correlationId,
      );
    }

    return new ApiError(message, 'unknown', error.status, body, correlationId);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'unknown');
  }

  return new ApiError('Erro inesperado.', 'unknown');
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}
