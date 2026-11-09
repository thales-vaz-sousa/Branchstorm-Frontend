import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { RoleBadgeComponent } from '@shared/ui/role-badge/role-badge.component';
import { BrandLoaderComponent } from '@shared/ui/brand-loader/brand-loader.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { ValidationBadgeComponent } from '@shared/ui/validation-badge/validation-badge.component';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { NotificationService } from '@core/ui/notification.service';
import { I18nService } from '@core/i18n/i18n.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TeamsStore } from '@features/teams/state/teams.store';
import { UserDirectoryStore } from '@features/users/state/user-directory.store';
import { IdeaListStore } from '@features/ideas/state/idea-list.store';
import { LinkFormDialogComponent } from '@features/ideas/ui/link-form-dialog/link-form-dialog.component';
import {
  TeamMemberRole,
  type TeamMember,
  type TeamMemberRoleName,
} from '@shared/models/team.model';
import type { CreateLinkRequest } from '@shared/models/link.model';
import {
  TEAM_ROLE_NAMES,
  roleDescription,
  roleLabel,
  teamRoleName,
} from '@shared/utils/enum.util';

@Component({
  selector: 'app-team-detail-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonDirective,
    BannerComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    PageHeaderComponent,
    RoleBadgeComponent,
    BrandLoaderComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    ValidationBadgeComponent,
    RelativeDatePipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-detail.page.html',
  styleUrl: './team-detail.page.scss',
})
export class TeamDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsStore = inject(TeamsStore);
  private readonly usersStore = inject(UserDirectoryStore);
  private readonly ideasStore = inject(IdeaListStore);
  private readonly dialogs = inject(DialogService);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);

  protected readonly team = this.teamsStore.currentTeamView;
  protected readonly loading = this.teamsStore.loading;
  protected readonly error = this.teamsStore.error;
  protected readonly users = this.usersStore.users;
  protected readonly usersByCode = this.usersStore.usersByCode;
  protected readonly problems = this.ideasStore.roots;
  protected readonly problemsLoading = this.ideasStore.loading;
  protected readonly problemsError = this.ideasStore.error;

  protected readonly code = signal('');
  protected readonly members = signal<readonly TeamMember[]>([]);
  protected readonly saving = signal(false);
  protected readonly creatingProblem = signal(false);
  protected readonly selectedUserCode = signal<string | null>(null);
  protected readonly selectedRole = signal<TeamMemberRole>(TeamMemberRole.Collaborator);

  protected readonly roleNames = TEAM_ROLE_NAMES;

  protected roleLabel(name: TeamMemberRoleName): string {
    return roleLabel(name, this.i18n.lang());
  }

  protected roleDescription(name: TeamMemberRoleName): string {
    return roleDescription(name, this.i18n.lang());
  }

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
  });

  private readonly nameValue = toSignal(this.nameControl.valueChanges, {
    initialValue: this.nameControl.value,
  });

  protected readonly availableUsers = computed(() => {
    const taken = new Set(this.members().map((member) => member.userCode));
    return this.users().filter((user) => !taken.has(user.code));
  });

  protected readonly dirty = computed(() => {
    const team = this.team();

    if (!team) {
      return false;
    }

    const currentMembers = this.members()
      .map((member) => `${member.userCode}:${member.role}`)
      .sort()
      .join('|');
    const originalMembers = team.members
      .map((member) => `${member.userCode}:${member.role}`)
      .sort()
      .join('|');

    return this.nameValue().trim() !== team.name || currentMembers !== originalMembers;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('teamCode');

      if (!code) {
        return;
      }

      this.code.set(code);
      void this.load(code);
    });

    void this.usersStore.loadAll();

    effect(() => {
      const team = this.team();

      if (!team) {
        return;
      }

      this.members.set(team.members.map(({ userCode, role }) => ({ userCode, role })));
      this.nameControl.setValue(team.name, { emitEvent: false });
    });
  }

  protected async load(code: string): Promise<void> {
    await Promise.all([this.teamsStore.load(code), this.ideasStore.load(code)]);
  }

  protected reloadProblems(): void {
    void this.ideasStore.load(this.code());
  }

  protected roleName(role: number): TeamMemberRoleName {
    return teamRoleName(role);
  }

  protected roleValue(role: TeamMemberRoleName): TeamMemberRole {
    switch (role) {
      case 'Admin':
        return TeamMemberRole.Admin;
      case 'Owner':
        return TeamMemberRole.Owner;
      case 'Evaluator':
        return TeamMemberRole.Evaluator;
      default:
        return TeamMemberRole.Collaborator;
    }
  }

  protected memberName(code: string): string {
    return this.usersByCode().get(code)?.name ?? this.i18n.t('canvas.memberFallback');
  }

  protected memberEmail(code: string): string {
    return this.usersByCode().get(code)?.email ?? '';
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected onUserSelected(code: string): void {
    this.selectedUserCode.set(code || null);
  }

  protected onRoleSelected(value: string): void {
    this.selectedRole.set(this.roleValue(value as TeamMemberRoleName));
  }

  protected addMember(): void {
    const userCode = this.selectedUserCode();

    if (!userCode) {
      return;
    }

    if (this.members().some((member) => member.userCode === userCode)) {
      this.notifications.info(this.i18n.t('detail.alreadyMember'));
      return;
    }

    this.members.update((members) => [...members, { userCode, role: this.selectedRole() }]);
    this.selectedUserCode.set(null);
  }

  protected removeMember(userCode: string): void {
    if (this.members().length <= 1) {
      this.notifications.error(this.i18n.t('detail.needOneMember'));
      return;
    }

    this.members.update((members) => members.filter((member) => member.userCode !== userCode));
  }

  protected changeRole(userCode: string, role: TeamMemberRole): void {
    this.members.update((members) =>
      members.map((member) => (member.userCode === userCode ? { ...member, role } : member)),
    );
  }

  protected reset(): void {
    const team = this.team();

    if (!team) {
      return;
    }

    this.members.set(team.members.map(({ userCode, role }) => ({ userCode, role })));
    this.nameControl.setValue(team.name, { emitEvent: false });
  }

  protected async save(): Promise<void> {
    if (this.nameControl.invalid || !this.dirty() || this.saving()) {
      this.nameControl.markAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      await this.teamsStore.updateMembers(this.code(), {
        name: this.nameControl.value.trim(),
        members: this.members(),
      });
      this.notifications.success(this.i18n.t('detail.updated'));
    } catch {
      this.notifications.error(this.i18n.t('detail.updateFailed'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async createProblem(): Promise<void> {
    const team = this.team();

    if (!team || this.creatingProblem()) {
      return;
    }

    const ref = this.dialogs.open<CreateLinkRequest, { mode: 'root'; teamCode: string }>(
      LinkFormDialogComponent,
      { data: { mode: 'root', teamCode: team.code } },
    );
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    this.creatingProblem.set(true);

    try {
      const created = await this.ideasStore.create(request);
      this.notifications.success(this.i18n.t('detail.problemCreated'));
      await this.router.navigate(['/ideias', created.code]);
    } catch {
      this.notifications.error(this.i18n.t('detail.problemCreateFailed'));
    } finally {
      this.creatingProblem.set(false);
    }
  }
}
