import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService, type LangCode } from '@core/i18n/i18n.service';

/** Sessão de idioma (mobile ≤640px): o botão de idioma do cabeçalho abre esta
    sessão (bottom sheet) em vez do menu popup, no padrão das demais sessões
    do app. Escolher um idioma aplica na hora e fecha a sessão. */
@Component({
  selector: 'app-language-dialog',
  imports: [DialogShellComponent, IconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell [title]="'shell.language' | translate" (closed)="close()">
      <div class="lang">
        @for (option of i18n.langs; track option.code) {
          <button
            class="lang__option"
            type="button"
            [class.lang__option--active]="option.code === i18n.lang()"
            (click)="choose(option.code)">
            <span>{{ option.nativeName }}</span>
            @if (option.code === i18n.lang()) {
              <app-icon name="check" [size]="16" />
            }
          </button>
        }
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .lang {
        display: flex;
        flex-direction: column;
      }

      .lang__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-height: 48px;
        padding: var(--space-2) var(--space-1);
        border: 0;
        border-bottom: 1px solid var(--line);
        background: transparent;
        color: var(--ink);
        font-size: var(--text-base);
        text-align: left;
        cursor: pointer;
      }

      .lang__option:last-child {
        border-bottom: 0;
      }

      .lang__option:hover {
        background: var(--soft);
        border-radius: var(--radius-control);
      }

      .lang__option--active {
        color: var(--tink);
        font-weight: 600;
      }
    `,
  ],
})
export class LanguageDialogComponent {
  protected readonly i18n = inject(I18nService);
  private readonly ref = inject(DialogRef);

  protected close(): void {
    this.ref.close();
  }

  protected choose(code: LangCode): void {
    this.i18n.setLang(code);
    this.close();
  }
}
