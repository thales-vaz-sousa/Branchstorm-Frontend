import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import type {
  CreateHypothesisRequest,
  HypothesisResult,
  RegisterHypothesisResultRequest,
} from '@shared/models/hypothesis.model';
import { HypothesisApi } from '../data-access/hypothesis-api.service';

interface HypothesisState {
  readonly items: readonly HypothesisResult[];
  readonly loading: boolean;
  readonly error: ApiError | null;
}

const EMPTY_STATE: HypothesisState = { items: [], loading: false, error: null };

@Injectable({ providedIn: 'root' })
export class HypothesisStore {
  private readonly api = inject(HypothesisApi);
  private readonly _states = signal<Readonly<Record<string, HypothesisState>>>({});
  private readonly _saving = signal(false);

  readonly saving = this._saving.asReadonly();
  readonly states = this._states.asReadonly();

  forLink(linkCode: string) {
    return computed(() => this._states()[linkCode] ?? EMPTY_STATE);
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

  async create(request: CreateHypothesisRequest): Promise<HypothesisResult> {
    this._saving.set(true);

    try {
      const created = await firstValueFrom(this.api.create(request));
      this.patch(request.linkCode, (state) => ({ items: [...state.items, created] }));
      return created;
    } finally {
      this._saving.set(false);
    }
  }

  async registerResult(
    linkCode: string,
    code: string,
    request: RegisterHypothesisResultRequest,
  ): Promise<HypothesisResult> {
    this._saving.set(true);

    try {
      const updated = await firstValueFrom(this.api.registerResult(code, request));
      this.patch(linkCode, (state) => ({
        items: state.items.map((item) => (item.code === code ? updated : item)),
      }));
      return updated;
    } finally {
      this._saving.set(false);
    }
  }

  private patch(
    linkCode: string,
    update:
      | Partial<HypothesisState>
      | ((state: HypothesisState) => Partial<HypothesisState>),
  ): void {
    this._states.update((states) => {
      const current = states[linkCode] ?? EMPTY_STATE;
      const next = typeof update === 'function' ? update(current) : update;
      return { ...states, [linkCode]: { ...current, ...next } };
    });
  }
}
