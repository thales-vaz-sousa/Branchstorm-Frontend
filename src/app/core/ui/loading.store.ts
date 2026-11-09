import { computed, Injectable, signal } from '@angular/core';

const COLD_START_MS = 4_000;

@Injectable({ providedIn: 'root' })
export class LoadingStore {
  private readonly activeRequests = signal(0);
  private readonly _coldStart = signal(false);
  private coldStartTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isLoading = computed(() => this.activeRequests() > 0);
  readonly coldStart = this._coldStart.asReadonly();

  start(): void {
    this.activeRequests.update((count) => count + 1);

    if (!this.coldStartTimer) {
      this.coldStartTimer = setTimeout(() => {
        this._coldStart.set(this.activeRequests() > 0);
      }, COLD_START_MS);
    }
  }

  stop(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));

    if (this.activeRequests() === 0) {
      this._coldStart.set(false);

      if (this.coldStartTimer) {
        clearTimeout(this.coldStartTimer);
        this.coldStartTimer = null;
      }
    }
  }
}
