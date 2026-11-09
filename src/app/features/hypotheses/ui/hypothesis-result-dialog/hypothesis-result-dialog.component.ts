import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type {
  HypothesisResult,
  RegisterHypothesisResultRequest,
} from '@shared/models/hypothesis.model';

export interface HypothesisResultDialogData {
  readonly hypothesis: HypothesisResult;
}

@Component({
  selector: 'app-hypothesis-result-dialog',
  imports: [
    ReactiveFormsModule,
    DialogShellComponent,
    ButtonDirective,
    FieldComponent,
    IconComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'hypo.resultTitle' | translate"
      [description]="data.hypothesis.description"
      (closed)="cancel()"
    >
      <form class="result-form" [formGroup]="form" (ngSubmit)="submit()">
        <fieldset class="result-options">
          <legend class="result-options__legend">{{ 'hypo.resultLabel' | translate }}</legend>

          <label class="result-option" [class.result-option--selected]="result === 'Validated'">
            <input
              type="radio"
              formControlName="result"
              value="Validated"
              (change)="result = 'Validated'"
            />
            <span class="result-option__mark" aria-hidden="true">
              <app-icon name="check" [size]="15" />
            </span>
            <span class="result-option__copy">
              <strong>{{ 'hypo.validated' | translate }}</strong>
              <small>{{ 'hypo.validatedHint' | translate }}</small>
            </span>
          </label>

          <label class="result-option" [class.result-option--selected]="result === 'Refuted'">
            <input
              type="radio"
              formControlName="result"
              value="Refuted"
              (change)="result = 'Refuted'"
            />
            <span class="result-option__mark" aria-hidden="true">
              <app-icon name="x" [size]="15" />
            </span>
            <span class="result-option__copy">
              <strong>{{ 'hypo.refuted' | translate }}</strong>
              <small>{{ 'hypo.refutedHint' | translate }}</small>
            </span>
          </label>
        </fieldset>

        <app-field controlId="result-reason" [label]="'hypo.reasonLabel' | translate">
          <textarea
            id="result-reason"
            class="bs-textarea"
            rows="3"
            formControlName="reason"
            maxlength="600"
          ></textarea>
        </app-field>

        <p class="hint">
          {{ 'hypo.hint' | translate }}
        </p>
      </form>

      <div dialogFooter class="dialog-actions">
        <button appButton variant="outline" type="button" (click)="cancel()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="submit()">
          {{ 'hypo.register' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .result-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .result-options {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-3);
        margin: 0;
        padding: 0;
        border: 0;
      }

      .result-options__legend {
        margin-bottom: var(--space-2);
        padding: 0;
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--ink);
      }

      .result-option {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        padding: var(--space-3);
        border: 1px solid var(--line);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition: border-color var(--duration-fast) var(--ease);
      }

      .result-option input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
      }

      .result-option__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 1px;
        border: 1px solid var(--line);
        border-radius: 50%;
        color: transparent;
      }

      .result-option__copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .result-option__copy strong {
        font-size: var(--text-sm);
        font-weight: 500;
      }

      .result-option__copy small {
        font-size: var(--text-xs);
        color: var(--muted);
      }

      .result-option--selected {
        border-color: var(--teal);
      }

      .result-option--selected .result-option__mark {
        border-color: var(--teal);
        background: var(--teal);
        color: var(--on-solid);
      }

      .result-option:focus-within {
        outline: 2px solid var(--teal);
        outline-offset: 2px;
      }

      .hint {
        font-size: var(--text-xs);
        color: var(--muted);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }

      @media (max-width: 480px) {
        .result-options {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class HypothesisResultDialogComponent {
  protected readonly data = inject<HypothesisResultDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<RegisterHypothesisResultRequest>>(DialogRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    result: ['Validated' as 'Validated' | 'Refuted', [Validators.required]],
    reason: ['', [Validators.maxLength(600)]],
  });

  protected get result(): 'Validated' | 'Refuted' {
    return this.form.controls.result.value;
  }

  protected set result(value: 'Validated' | 'Refuted') {
    this.form.controls.result.setValue(value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ref.close({
      result: this.form.controls.result.value,
      reason: this.form.controls.reason.value.trim() || null,
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
