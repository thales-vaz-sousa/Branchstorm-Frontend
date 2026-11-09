import {
  type ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { correlationIdInterceptor } from '@core/api/interceptors/correlation-id.interceptor';
import { authInterceptor } from '@core/api/interceptors/auth.interceptor';
import { loadingInterceptor } from '@core/api/interceptors/loading.interceptor';
import { errorInterceptor } from '@core/api/interceptors/error.interceptor';
import { mockApiInterceptor } from '@core/mock/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withHashLocation(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        authInterceptor,
        loadingInterceptor,
        mockApiInterceptor,
        errorInterceptor,
      ]),
    ),
    // PWA: service worker só em produção (dev não cacheia, para HMR funcionar).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable',
    }),
  ],
};
