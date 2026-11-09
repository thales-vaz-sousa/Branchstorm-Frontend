import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type { CreateFeedbackRequest } from '@shared/models/feedback.model';

export interface FeedbackFormDialogData {
  readonly linkCode: string;
  readonly linkTitle: string;
  readonly autorCode: string;
}

@Component({
  selector: 'app-feedback-form-dialog',
  imports: [ReactiveFormsModule, DialogShellComponent, ButtonDirective, FieldComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'feedback.title' | translate"
      [description]="data.linkTitle"
      (closed)="cancel()"
    >
      <form class="feedback-form" [formGroup]="form" (ngSubmit)="submit()">
        <fieldset class="rating">
          <legend class="rating__label">{{ 'feedback.rating' | translate }}</legend>
          <div class="rating__stars" role="radiogroup" [attr.aria-label]="'feedback.ratingAria' | translate">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <button
                type="button"
                role="radio"
                class="rating__star"
                [class.rating__star--active]="form.controls.rating.value >= star"
                [attr.aria-checked]="form.controls.rating.value === star"
                [attr.aria-label]="'feedback.ratingStar' | translate: { star: star }"
                (click)="setRating(star)"
              >
                ★
              </button>
            }
            <span class="rating__value">{{ form.controls.rating.value }}/5</span>
          </div>
        </fieldset>

        <app-field
          controlId="feedback-test"
          [label]="'feedback.commentLabel' | translate"
          required="true"
          [hint]="'feedback.commentHint' | translate"
          [error]="
            form.controls.test.touched && form.controls.test.invalid
              ? ('feedback.commentError' | translate)
              : ''
          "
        >
          <textarea
            id="feedback-test"
            class="bs-textarea"
            rows="4"
            formControlName="test"
            maxlength="1200"
          ></textarea>
        </app-field>

        <p class="hint">{{ 'feedback.hint' | translate }}</p>
      </form>

      <div dialogFooter class="dialog-actions">
        <button appButton variant="outline" type="button" (click)="cancel()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="submit()">
          {{ 'feedback.submit' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .feedback-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .rating {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        margin: 0;
        padding: 0;
        border: 0;
      }

      .rating__label {
        margin: 0;
        padding: 0;
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--ink);
      }

      .rating__stars {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .rating__star {
        border: 0;
        background: none;
        padding: 0 2px;
        font-size: 30px;
        line-height: 1;
        color: var(--line);
        cursor: pointer;
        transition: color var(--duration-fast) var(--ease);
      }

      .rating__star:hover {
        color: var(--teal);
      }

      .rating__star--active {
        color: var(--teal);
      }

      .rating__star:focus-visible {
        outline: 2px solid var(--teal);
        outline-offset: 2px;
        border-radius: var(--radius-control);
      }

      .rating__value {
        margin-left: var(--space-2);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--muted);
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
    `,
  ],
})
export class FeedbackFormDialogComponent {
  protected readonly data = inject<FeedbackFormDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<CreateFeedbackRequest>>(DialogRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    test: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1200)]],
  });

  protected setRating(value: number): void {
    this.form.controls.rating.setValue(value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ref.close({
      linkCode: this.data.linkCode,
      autorCode: this.data.autorCode,
      test: this.form.controls.test.value.trim(),
      rating: this.form.controls.rating.value,
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
