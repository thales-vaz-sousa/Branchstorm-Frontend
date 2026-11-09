import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonDirective } from '../button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DialogShellComponent } from './dialog-shell.component';

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogShellComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell [title]="data.title" (closed)="close(false)">
      <p class="confirm__message">{{ data.message }}</p>

      <div dialogFooter class="confirm__actions">
        <button appButton variant="outline" type="button" (click)="close(false)">
          {{ data.cancelLabel ?? ('common.cancel' | translate) }}
        </button>
        <button
          appButton
          variant="filled"
          type="button"
          [class.confirm__danger]="data.destructive"
          (click)="close(true)">
          {{ data.confirmLabel ?? ('common.confirm' | translate) }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .confirm__message {
        font-size: var(--text-base);
        color: var(--muted);
      }

      .confirm__actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
      }

      .confirm__danger {
        background: var(--danger);
        color: var(--on-solid);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected close(result: boolean): void {
    this.ref.close(result);
  }
}
