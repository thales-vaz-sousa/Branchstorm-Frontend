import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import type { CreateFeedbackRequest, FeedbackResult } from '@shared/models/feedback.model';
import { FeedbackApi } from '../data-access/feedback-api.service';

interface FeedbackState {
  readonly items: readonly FeedbackResult[];
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const EMPTY_STATE: FeedbackState = { items: [], loading: false, error: null };

@Injectable({ providedIn: 'root' })
export class FeedbackStore {
  private readonly api = inject(FeedbackApi);
  private readonly _states = signal<Readonly<Record<string, FeedbackState>>>({});
  private readonly _saving = signal(false);

  readonly saving = this._saving.asReadonly();
  readonly states = this._states.asReadonly();

  forLink(linkCode: string) {
    return computed(() => {
      const state = this._states()[linkCode] ?? EMPTY_STATE;
      const total = state.items.length;
      const average =
        total === 0 ? 0 : state.items.reduce((sum, item) => sum + item.rating, 0) / total;

      return { ...state, average, total };
    });
  }

  async load(linkCode: string): Promise<void> {
    this.patch(linkCode, { loading: true, error: null });

    try {
      const items = await firstValueFrom(this.api.list(linkCode));
      this.patch(linkCode, { items, loading: false });
    } catch (error) {
      this.patch(linkCode, { loading: false, error: toApiError(error) });
    }
  }

  async create(request: CreateFeedbackRequest): Promise<FeedbackResult> {
    this._saving.set(true);

    try {
      const created = await firstValueFrom(this.api.create(request));
      this.patch(request.linkCode, (state) => ({
        items: [created, ...state.items],
      }));
      return created;
    } finally {
      this._saving.set(false);
    }
  }

  private patch(
    linkCode: string,
    update: Partial<FeedbackState> | ((state: FeedbackState) => Partial<FeedbackState>),
  ): void {
    this._states.update((states) => {
      const current = states[linkCode] ?? EMPTY_STATE;
      const next = typeof update === 'function' ? update(current) : update;
      return { ...states, [linkCode]: { ...current, ...next } };
    });
  }
}
