import { computed, Injectable, signal } from '@angular/core';
import { DICTS, type LangCode, type LangParams } from './dictionaries';

export type { LangCode };

/** Língua persistida (sem DI — também serve para interceptors e funções puras). */
export function currentLang(): LangCode {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'en' || stored === 'es' || stored === 'fr' ? stored : 'pt';
}

export interface LangInfo {
  readonly code: LangCode;
  /** Nome nativo (sempre no idioma de origem). */
  readonly nativeName: string;
  /** Rótulo curto para o botão/menu. */
  readonly label: string;
}

/** Idiomas suportados, na ordem do seletor. */
export const LANGS: readonly LangInfo[] = [
  { code: 'pt', nativeName: 'Português', label: 'Português' },
  { code: 'en', nativeName: 'English', label: 'English' },
  { code: 'es', nativeName: 'Español', label: 'Español' },
  { code: 'fr', nativeName: 'Français', label: 'Français' },
] as const;

const LANG_KEY = 'bs.lang';

/**
 * Serviço de tradução em runtime (sem lib nova — no espírito do kit próprio).
 * Escolha persistida em `localStorage`, refletida em `document.lang`, com
 * troca instantânea (signals) sem recarregar a página.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<LangCode>(this.readLang());

  readonly lang = this._lang.asReadonly();
  readonly langs = LANGS;

  readonly currentLabel = computed(
    () => LANGS.find((item) => item.code === this._lang())?.label ?? 'Português',
  );

  constructor() {
    document.documentElement.lang = this._lang();
  }

  /** Traduz uma chave no idioma atual (com fallback para o português). */
  t(key: string, params?: LangParams): string {
    return translate(key, this._lang(), params);
  }

  setLang(code: LangCode): void {
    this._lang.set(code);
    localStorage.setItem(LANG_KEY, code);
    document.documentElement.lang = code;
  }

  private readLang(): LangCode {
    return currentLang();
  }
}

/** Tradução pura (testável/isolada): idioma → dicionário → PT → chave. */
export function translate(key: string, lang: LangCode, params?: LangParams): string {
  const template = DICTS[lang][key] ?? DICTS.pt[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    String(params[name] ?? `{${name}}`),
  );
}
