import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.page-header--actions-in-bar]': 'hideActionsOnMobile()',
  },
  template: `
    <header class="page-header">
      <div class="page-header__copy">
        @if (eyebrow()) {
          <span class="bs-eyebrow">{{ eyebrow() }}</span>
        }
        <div class="page-header__titlerow">
          <h1>{{ title() }}</h1>
          <!-- Ação de ajustes da própria página (ex.: ⚙ da equipe no mobile). -->
          <ng-content select="[pageSettings]" />
        </div>
        @if (description()) {
          <p class="page-header__description">{{ description() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content select="[pageActions]" />
      </div>
    </header>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-4);
        flex-wrap: wrap;
        margin-bottom: var(--space-6);
      }

      .page-header__copy {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 0;
      }

      /* Título + ação de ajustes na mesma linha (o ⚙ vai para a ponta
         direita via margin-left: auto no botão projetado). */
      .page-header__titlerow {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-width: 0;
      }

      .page-header__titlerow h1 {
        min-width: 0;
      }

      .page-header__description {
        max-width: 64ch;
        color: var(--muted);
        font-size: var(--text-base);
      }

      .page-header__actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex-wrap: wrap;
      }

      @media (max-width: 640px) {
        .page-header {
          align-items: flex-start;
        }

        /* Ações escondidas no mobile: a página as repete numa barra inferior
           fixa (padrão da barra do canvas — ex.: team-detail). */
        :host(.page-header--actions-in-bar) .page-header__actions {
          display: none;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  /** Esconde as ações do cabeçalho no mobile (≤640px) — a página as repete
      numa barra inferior fixa. Desktop (>640px) sempre as exibe. */
  readonly hideActionsOnMobile = input(false);
}
