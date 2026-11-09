import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { BrandLoaderComponent } from '@shared/ui/brand-loader/brand-loader.component';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@core/i18n/i18n.service';
import { SessionStore } from '@core/auth/session.store';
import { NotificationService } from '@core/ui/notification.service';
import { TeamsStore } from '@features/teams/state/teams.store';
import { TeamFormDialogComponent } from '@features/teams/ui/team-form-dialog/team-form-dialog.component';
import type { CreateTeamRequest } from '@shared/models/team.model';

@Component({
  selector: 'app-teams-page',
  imports: [
    RouterLink,
    ButtonDirective,
    BannerComponent,
    CardComponent,
    EmptyStateComponent,
    IconComponent,
    PageHeaderComponent,
    BrandLoaderComponent,
    RelativeDatePipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams.page.html',
  styleUrl: './teams.page.scss',
})
export class TeamsPage {
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly i18n = inject(I18nService);
  private readonly teamsStore = inject(TeamsStore);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);

  protected readonly teams = this.teamsStore.teams;
  protected readonly loading = this.teamsStore.loading;
  protected readonly error = this.teamsStore.error;
  protected readonly recentTeams = this.teamsStore.recentTeams;

  constructor() {
    const userCode = this.session.userCode();

    if (userCode) {
      void this.teamsStore.loadMine(userCode);
    }
  }

  protected reload(): void {
    const userCode = this.session.userCode();

    if (userCode) {
      void this.teamsStore.loadMine(userCode);
    }
  }

  protected async createTeam(): Promise<void> {
    const ref = this.dialogs.open<CreateTeamRequest>(TeamFormDialogComponent);
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    try {
      const team = await this.teamsStore.create(request);
      this.notifications.success(this.i18n.t('teams.created'));
      await this.router.navigate(['/equipes', team.code]);
    } catch {
      this.notifications.error(this.i18n.t('teams.createFailed'));
    }
  }
}
