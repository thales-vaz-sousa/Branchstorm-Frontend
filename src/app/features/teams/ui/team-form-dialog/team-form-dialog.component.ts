import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionStore } from '@core/auth/session.store';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@core/i18n/i18n.service';
import type { CreateTeamRequest } from '@shared/models/team.model';
import { TeamMemberRole } from '@shared/models/team.model';

@Component({
  selector: 'app-team-form-dialog',
  imports: [
    ReactiveFormsModule,
    DialogShellComponent,
    ButtonDirective,
    FieldComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'team.form.title' | translate"
      [description]="'team.form.desc' | translate"
      (closed)="cancel()">
      <form class="team-form" [formGroup]="form" (ngSubmit)="submit()">
        <app-field
          controlId="team-name"
          [label]="'team.form.name' | translate"
          required="true"
          [error]="
            form.controls.name.touched && form.controls.name.invalid
              ? ('team.form.nameError' | translate)
              : ''
          ">
          <input
            id="team-name"
            class="bs-input"
            type="text"
            formControlName="name"
            maxlength="80"
            [placeholder]="'team.form.namePh' | translate" />
        </app-field>

        <div class="owner">
          <span class="owner__avatar">{{ ownerInitials() }}</span>
          <div class="owner__copy">
            <strong>{{ ownerName() }}</strong>
            <span>{{ 'team.form.owner' | translate: { email: ownerEmail() } }}</span>
          </div>
        </div>

        @if (error()) {
          <p class="team-form__error">{{ error() }}</p>
        }
      </form>

      <div dialogFooter class="team-form__actions">
        <button appButton variant="outline" type="button" (click)="cancel()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="submit()">
          {{ 'team.form.create' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .team-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .owner {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border: 1px dashed var(--line);
        border-radius: var(--radius-control);
      }

      .owner__avatar {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--soft);
        color: var(--tink);
        font-size: var(--text-xs);
        font-weight: 700;
      }

      .owner__copy {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }

      .owner__copy span {
        color: var(--muted);
        font-size: var(--text-xs);
      }

      .team-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }

      .team-form__error {
        color: var(--danger);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class TeamFormDialogComponent {
  private readonly ref = inject<DialogRef<CreateTeamRequest>>(DialogRef);
  private readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly session = inject(SessionStore);

  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

  protected ownerName(): string {
    return this.session.user()?.name ?? '';
  }

  protected ownerEmail(): string {
    return this.session.user()?.email ?? '';
  }

  protected ownerInitials(): string {
    return this.session.initials();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userCode = this.session.userCode();

    if (!userCode) {
      this.error.set(this.i18n.t('team.expired'));
      return;
    }

    const request: CreateTeamRequest = {
      name: this.form.controls.name.value.trim(),
      members: [{ userCode, role: TeamMemberRole.Owner }],
    };

    this.ref.close(request);
  }

  protected cancel(): void {
    this.ref.close();
  }
}
