import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ButtonDirective } from '../button/button.directive';
import { IconComponent } from '../icon/icon.component';

/**
 * Casca visual dos diálogos. O comportamento (foco, ESC, backdrop) vem do CDK.
 */
@Component({
  selector: 'app-dialog-shell',
  imports: [ButtonDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="dialog__head">
        <div class="dialog__heading">
          <h2 class="dialog__title">{{ title() }}</h2>
          @if (description()) {
            <p class="dialog__description">{{ description() }}</p>
          }
        </div>
        <button
          appButton
          variant="text"
          size="sm"
          type="button"
          class="dialog__close"
          aria-label="Fechar"
          (click)="dismiss()">
          <app-icon name="x" />
        </button>
      </header>

      <div class="dialog__body">
        <ng-content />
      </div>

      @if (hasFooter()) {
        <footer class="dialog__foot">
          <ng-content select="[dialogFooter]" />
        </footer>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dialog {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-height: min(86vh, 760px);
        background: var(--card);
        border: 1px solid var(--line);
        border-bottom: 0;
        border-radius: 12px 12px 0 0;
        overflow: hidden;
        animation: bs-sheet-in 180ms var(--ease);
      }

      @keyframes bs-sheet-in {
        from {
          opacity: 0;
          transform: translateY(48px);
        }

        to {
          opacity: 1;
          transform: none;
        }
      }

      .dialog__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-4);
        padding: var(--space-5) var(--space-6) var(--space-4);
        border-bottom: 1px solid var(--line);
      }

      .dialog__heading {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .dialog__title {
        font-family: var(--font-sans);
        font-size: var(--text-xl);
        font-weight: 500;
        line-height: 1.3;
        color: var(--ink);
      }

      .dialog__description {
        font-size: var(--text-sm);
        color: var(--muted);
      }

      .dialog__close {
        margin: -4px -8px 0 0;
        color: var(--muted);
      }

      .dialog__body {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-5) var(--space-6);
        overflow-y: auto;
      }

      .dialog__foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--space-4) var(--space-6);
        border-top: 1px solid var(--line);
      }
    `,
  ],
})
export class DialogShellComponent {
  private readonly ref = inject<DialogRef<unknown> | null>(DialogRef, { optional: true });

  readonly title = input.required<string>();
  readonly description = input('');
  readonly hasFooter = input(true);
  readonly closed = output<void>();

  protected dismiss(): void {
    this.closed.emit();
    this.ref?.close();
  }
}
