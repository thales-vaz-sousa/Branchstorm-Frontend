import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { catchError, EMPTY, mergeMap, retryWhen, throwError, timeout, timer } from 'rxjs';
import { NotificationService } from '@core/ui/notification.service';
import { toApiError } from '../api-error';

const REQUEST_TIMEOUT_MS = 90_000;
const GET_RETRY_DELAYS = [1_000, 3_000];

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);
  const source = next(request).pipe(timeout({ each: REQUEST_TIMEOUT_MS }));

  const retried =
    request.method === 'GET'
      ? source.pipe(
          retryWhen((errors) => {
            let attempt = 0;

            return errors.pipe(
              mergeMap((error: unknown) => {
                if (attempt >= GET_RETRY_DELAYS.length || !toApiError(error).isRetryable) {
                  return EMPTY;
                }

                const backoff = GET_RETRY_DELAYS[attempt] ?? 0;
                attempt += 1;
                return timer(backoff);
              }),
            );
          }),
        )
      : source;

  return retried.pipe(
    catchError((error: unknown) => {
      const apiError = toApiError(error);

      if (
        apiError.kind === 'network' ||
        apiError.kind === 'server' ||
        apiError.kind === 'timeout' ||
        apiError.kind === 'unknown'
      ) {
        notifications.error(apiError.message);
      }

      return throwError(() => apiError);
    }),
  );
};
