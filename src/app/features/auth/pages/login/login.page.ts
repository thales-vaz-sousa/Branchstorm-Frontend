import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { FieldComponent } from '@shared/ui/field/field.component';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SessionStore } from '@core/auth/session.store';
import { anyMockEnabled } from '@core/mock/mock-mode';
import { I18nService } from '@core/i18n/i18n.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UserDirectoryStore } from '@features/users/state/user-directory.store';
import { environment } from '@env/environment';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    FieldComponent,
    BannerComponent,
    EmptyStateComponent,
    SpinnerComponent,
    IconComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly users = inject(UserDirectoryStore);
  private readonly session = inject(SessionStore);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly environment = environment;
  protected readonly demoMode = anyMockEnabled();
  protected readonly loading = this.users.loading;
  protected readonly error = this.users.error;
  protected readonly usersList = this.users.users;
  protected readonly selectedCode = signal<string | null>(null);
  protected readonly showCreate = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly selectedUser = computed(() => {
    const code = this.selectedCode();
    return this.usersList().find((user) => user.code === code) ?? null;
  });

  protected readonly createForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      document.title = `${this.i18n.t('login.enter')} · Branchstorm`;
    });

    void this.loadUsers();
  }

  protected async loadUsers(): Promise<void> {
    await this.users.loadAll();

    if (!this.selectedCode()) {
      this.selectedCode.set(this.usersList()[0]?.code ?? null);
    }
  }

  protected selectUser(code: string): void {
    this.selectedCode.set(code);
  }

  protected toggleCreate(): void {
    this.showCreate.update((open) => !open);
    this.createError.set(null);
  }

  protected async createUser(): Promise<void> {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    try {
      const user = await this.users.create(this.createForm.getRawValue());
      this.selectedCode.set(user.code);
      this.showCreate.set(false);
      this.createForm.reset();
    } catch (error) {
      this.createError.set(
        error instanceof Error ? error.message : this.i18n.t('login.createError'),
      );
    } finally {
      this.creating.set(false);
    }
  }

  protected async enter(): Promise<void> {
    const user = this.selectedUser();

    if (!user) {
      return;
    }

    this.session.setUser(user);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/equipes';
    await this.router.navigateByUrl(returnUrl);
  }
}
