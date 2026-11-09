import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import type { CreateUserRequest, FindUsersQuery, UserResult } from '@shared/models/user.model';
import { UserApi } from '@features/users/data-access/user-api.service';

@Injectable({ providedIn: 'root' })
export class UserDirectoryStore {
  private readonly api = inject(UserApi);
  private readonly _users = signal<readonly UserResult[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly usersByCode = computed(
    () => new Map(this._users().map((user) => [user.code, user] as const)),
  );

  async loadAll(): Promise<void> {
    await this.search({});
  }

  async search(query: FindUsersQuery): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this._users.set(await firstValueFrom(this.api.find(query)));
    } catch (error) {
      this._error.set(toApiError(error));
    } finally {
      this._loading.set(false);
    }
  }

  async ensureLoaded(codes: readonly string[]): Promise<void> {
    const known = this.usersByCode();
    const missing = [...new Set(codes)].filter((code) => !known.has(code));

    if (missing.length === 0) {
      return;
    }

    try {
      const users = await firstValueFrom(this.api.findByCodes(missing));
      this.merge(users);
    } catch (error) {
      this._error.set(toApiError(error));
    }
  }

  async create(request: CreateUserRequest): Promise<UserResult> {
    const user = await firstValueFrom(this.api.create(request));
    this.merge([user]);
    return user;
  }

  private merge(users: readonly UserResult[]): void {
    this._users.update((current) => {
      const byCode = new Map(current.map((user) => [user.code, user] as const));

      for (const user of users) {
        byCode.set(user.code, user);
      }

      return [...byCode.values()];
    });
  }
}
