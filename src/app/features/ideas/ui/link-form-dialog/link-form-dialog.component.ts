import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionStore } from '@core/auth/session.store';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@core/i18n/i18n.service';
import type { CreateLinkRequest, LinkResult, LinkType } from '@shared/models/link.model';
import { LinkType as LinkTypeValue } from '@shared/models/link.model';
import { linkTypeLabel } from '@shared/utils/enum.util';
import { TeamsStore } from '@features/teams/state/teams.store';

export interface LinkFormDialogData {
  readonly mode: 'root' | 'child';
  readonly father?: LinkResult | null;
  readonly teamCode?: string | null;
  readonly defaultType?: LinkType;
}

@Component({
  selector: 'app-link-form-dialog',
  imports: [
    ReactiveFormsModule,
    DialogShellComponent,
    ButtonDirective,
    FieldComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell [title]="title()" [description]="description()" (closed)="cancel()">
      <form class="link-form" [formGroup]="form" (ngSubmit)="submit()">
        <app-field
          controlId="link-title"
          [label]="'link.titleLabel' | translate"
          required="true"
          [hint]="form.controls.title.value.length + '/140'"
          [error]="
            form.controls.title.touched && form.controls.title.invalid
              ? ('link.titleError' | translate)
              : ''
          ">
          <input
            id="link-title"
            class="bs-input"
            type="text"
            formControlName="title"
            maxlength="140"
            [placeholder]="'link.placeholder' | translate" />
        </app-field>

        <app-field controlId="link-description" [label]="'link.descLabel' | translate">
          <textarea
            id="link-description"
            class="bs-textarea"
            rows="4"
            formControlName="description"
            maxlength="2000"></textarea>
        </app-field>

        <app-field
          controlId="link-reason"
          [label]="'link.reasonLabel' | translate"
          [hint]="'link.reasonHint' | translate">
          <textarea
            id="link-reason"
            class="bs-textarea"
            rows="3"
            formControlName="reason"
            maxlength="600"></textarea>
        </app-field>

        @if (data.mode === 'root' && !data.teamCode && teams().length > 0) {
          <app-field controlId="link-team" [label]="'link.teamLabel' | translate">
            <select id="link-team" class="bs-select" formControlName="teamCode">
              <option [ngValue]="null">{{ 'link.noTeam' | translate }}</option>
              @for (team of teams(); track team.code) {
                <option [ngValue]="team.code">{{ team.name }}</option>
              }
            </select>
          </app-field>
        }

        @if (error()) {
          <p class="link-form__error">{{ error() }}</p>
        }
      </form>

      <div dialogFooter class="link-form__actions">
        <button appButton variant="outline" type="button" (click)="cancel()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="submit()">
          {{ (data.mode === 'root' ? 'link.submitRoot' : 'link.submitChild') | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .link-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .link-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }

      .link-form__error {
        color: var(--danger);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class LinkFormDialogComponent {
  protected readonly data = inject<LinkFormDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<CreateLinkRequest>>(DialogRef);
  private readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly session = inject(SessionStore);
  protected readonly teamsStore = inject(TeamsStore);

  protected readonly error = signal<string | null>(null);
  protected readonly teams = this.teamsStore.teams;

  protected readonly title = computed(() =>
    this.data.mode === 'root'
      ? this.i18n.t('link.root.title')
      : this.i18n.t('link.child.title', { type: this.typeLabel().toLowerCase() }),
  );

  protected readonly description = computed(() => {
    if (this.data.mode === 'root') {
      return this.i18n.t('link.root.desc');
    }

    return this.i18n.t('link.child.desc', { father: this.data.father?.title ?? '' });
  });

  protected readonly typeLabel = computed(() => {
    const fatherType = this.data.father?.type;
    return linkTypeLabel(fatherType === 'Problem' ? 'Solution' : 'Version', this.i18n.lang());
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    type: [this.resolveDefaultType()],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    description: ['', [Validators.maxLength(2000)]],
    reason: ['', [Validators.maxLength(600)]],
    teamCode: [this.data.teamCode ?? (null as string | null)],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CreateLinkRequest = {
      fatherCode: this.data.mode === 'child' ? (this.data.father?.code ?? null) : null,
      type: raw.type,
      title: raw.title.trim(),
      description: raw.description.trim() || null,
      reason: raw.reason.trim() || null,
      autorCode: this.session.userCode(),
      teamCode:
        this.data.mode === 'root' ? raw.teamCode : (this.data.father?.teamCode ?? raw.teamCode),
    };

    this.ref.close(request);
  }

  protected cancel(): void {
    this.ref.close();
  }

  private resolveDefaultType(): LinkType {
    if (this.data.defaultType !== undefined) {
      return this.data.defaultType;
    }

    if (this.data.mode === 'root') {
      return LinkTypeValue.Problem;
    }

    return this.data.father?.type === 'Problem' ? LinkTypeValue.Solution : LinkTypeValue.Version;
  }
}
