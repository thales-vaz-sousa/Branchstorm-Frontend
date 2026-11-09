import { computed, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = 'bs.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _preference = signal<ThemePreference>(this.readPreference());

  readonly preference = this._preference.asReadonly();
  readonly isDark = computed(() => {
    const preference = this._preference();

    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return preference === 'dark';
  });

  constructor() {
    this.apply(this._preference());
  }

  set(preference: ThemePreference): void {
    this._preference.set(preference);
    localStorage.setItem(THEME_KEY, preference);
    this.apply(preference);
  }

  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  private apply(preference: ThemePreference): void {
    const root = document.documentElement;

    if (preference === 'system') {
      delete root.dataset['theme'];
      root.style.colorScheme = '';
      return;
    }

    root.dataset['theme'] = preference;
    root.style.colorScheme = preference;
  }

  private readPreference(): ThemePreference {
    const stored = localStorage.getItem(THEME_KEY);

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }

    return 'system';
  }
}
