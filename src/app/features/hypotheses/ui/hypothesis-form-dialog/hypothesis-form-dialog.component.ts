import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type { CreateHypothesisRequest } from '@shared/models/hypothesis.model';

export interface HypothesisFormDialogData {
  readonly linkCode: string;
  readonly linkTitle: string;
}

@Component({
  selector: 'app-hypothesis-form-dialog',
  imports: [ReactiveFormsModule, DialogShellComponent, ButtonDirective, FieldComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'hypo.title' | translate"
      [description]="'hypo.testIn' | translate: { title: data.linkTitle }"
      (closed)="cancel()"
    >
      <form class="hypothesis-form" [formGroup]="form" (ngSubmit)="submit()">
        <app-field
          controlId="hypothesis-description"
          [label]="'hypo.label' | translate"
          required="true"
          [hint]="form.controls.description.value.length + '/600'"
          [error]="
            form.controls.description.touched && form.controls.description.invalid
              ? ('hypo.error' | translate)
              : ''
          "
        >
          <textarea
            id="hypothesis-description"
            class="bs-textarea"
            rows="3"
            formControlName="description"
            maxlength="600"
            [placeholder]="'hypo.ph1' | translate"
          ></textarea>
        </app-field>

        <app-field
          controlId="hypothesis-criteria"
          [label]="'hypo.criteriaLabel' | translate"
          required="true"
          [hint]="'hypo.criteriaHint' | translate"
          [error]="
            form.controls.successCriteria.touched && form.controls.successCriteria.invalid
              ? ('hypo.criteriaError' | translate)
              : ''
          "
        >
          <textarea
            id="hypothesis-criteria"
            class="bs-textarea"
            rows="3"
            formControlName="successCriteria"
            maxlength="600"
            [placeholder]="'hypo.ph2' | translate"
          ></textarea>
        </app-field>
      </form>

      <div dialogFooter class="dialog-actions">
        <button appButton variant="outline" type="button" (click)="cancel()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="submit()">
          {{ 'hypo.create' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .hypothesis-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }
    `,
  ],
})
export class HypothesisFormDialogComponent {
  protected readonly data = inject<HypothesisFormDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<CreateHypothesisRequest>>(DialogRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(600)]],
    successCriteria: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(600)],
    ],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.ref.close({
      linkCode: this.data.linkCode,
      description: raw.description.trim(),
      successCriteria: raw.successCriteria.trim(),
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
