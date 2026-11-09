import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import type { CreateLinkRequest, LinkResult } from '@shared/models/link.model';
import { IdeaApi } from '../data-access/idea-api.service';

@Injectable({ providedIn: 'root' })
export class IdeaListStore {
  private readonly api = inject(IdeaApi);
  private readonly _roots = signal<readonly LinkResult[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly roots = this._roots.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(teamCode?: string | null): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this._roots.set(await firstValueFrom(this.api.findRoots(teamCode ?? undefined)));
    } catch (error) {
      this._error.set(toApiError(error));
    } finally {
      this._loading.set(false);
    }
  }

  async create(request: CreateLinkRequest): Promise<LinkResult> {
    const created = await firstValueFrom(this.api.create(request));

    if (!request.fatherCode) {
      this._roots.update((roots) => [created, ...roots]);
    }

    return created;
  }
}
