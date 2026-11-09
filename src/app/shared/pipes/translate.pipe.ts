import { inject, Pipe, type PipeTransform } from '@angular/core';
import { I18nService } from '@core/i18n/i18n.service';
import type { LangParams } from '@core/i18n/dictionaries';

/**
 * `{{ 'nav.teams' | translate }}` — `impure` para reagir à troca de idioma
 * sem reload (lê o signal dentro do transform).
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: LangParams): string {
    return this.i18n.t(key, params);
  }
}
