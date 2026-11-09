import { computed, Injectable, signal } from '@angular/core';
import type { UserResult } from '@shared/models/user.model';

const SESSION_KEY = 'bs.session.user';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _user = signal<UserResult | null>(this.readSession());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly userCode = computed(() => this._user()?.code ?? null);
  readonly initials = computed(() => {
    const name = this._user()?.name;

    if (!name) {
      return '?';
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  setUser(user: UserResult): void {
    this._user.set(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  clear(): void {
    this._user.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private readSession(): UserResult | null {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserResult>;

      if (typeof parsed.code === 'string' && typeof parsed.name === 'string') {
        return {
          code: parsed.code,
          name: parsed.name,
          email: parsed.email ?? '',
        };
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }

    return null;
  }
}
