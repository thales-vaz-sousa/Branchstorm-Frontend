import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { SessionStore } from '@core/auth/session.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const userCode = inject(SessionStore).userCode();

  if (!userCode) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        'X-User-Code': userCode,
      },
    }),
  );
};
