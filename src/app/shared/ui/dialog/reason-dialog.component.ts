import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonDirective } from '../button/button.directive';
import { FieldComponent } from '../field/field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { DialogShellComponent } from './dialog-shell.component';

export interface ReasonDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly placeholder?: string;
  readonly requireReason?: boolean;
  readonly destructive?: boolean;
}

@Component({
  selector: 'app-reason-dialog',
  imports: [DialogShellComponent, ButtonDirective, FieldComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell [title]="data.title" [description]="data.message" (closed)="close(undefined)">
      <app-field
        controlId="reason"
        [label]="
          data.requireReason ? ('reason.reason' | translate) : ('reason.optional' | translate)
        "
        [hint]="data.requireReason ? ('reason.required' | translate) : ('reason.hint' | translate)"
        [error]="showError() ? ('common.invalidTitle3' | translate) : ''">
        <textarea
          id="reason"
          class="bs-textarea"
          rows="4"
          maxlength="600"
          [placeholder]="data.placeholder ?? ('reason.placeholder' | translate)"
          [attr.aria-invalid]="showError() ? 'true' : null"
          [attr.aria-describedby]="'reason-hint'"
          [value]="reason()"
          (input)="onInput($event)"></textarea>
      </app-field>

      <div dialogFooter class="reason__actions">
        <button appButton variant="outline" type="button" (click)="close(undefined)">
          {{ 'common.cancel' | translate }}
        </button>
        <button
          appButton
          variant="filled"
          type="button"
          [class.reason__danger]="data.destructive"
          (click)="confirm()">
          {{ data.confirmLabel ?? ('common.confirm' | translate) }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .reason__actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
      }

      .reason__danger {
        background: var(--danger);
        color: var(--on-solid);
      }
    `,
  ],
})
export class ReasonDialogComponent {
  protected readonly data = inject<ReasonDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<string | undefined>>(DialogRef);

  protected readonly reason = signal('');
  protected readonly showError = signal(false);

  protected onInput(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
    if (this.showError() && this.reason().trim().length >= 3) {
      this.showError.set(false);
    }
  }

  protected confirm(): void {
    const value = this.reason().trim();

    if (this.data.requireReason && value.length < 3) {
      this.showError.set(true);
      return;
    }

    // '' = confirmado sem motivo (opcional); undefined = cancelado.
    this.close(value);
  }

  protected close(result: string | undefined): void {
    this.ref.close(result);
  }
}
