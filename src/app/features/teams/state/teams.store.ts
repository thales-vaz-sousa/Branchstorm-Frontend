import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import { RecentStore } from '@core/storage/recent.store';
import type {
  CreateTeamRequest,
  TeamResult,
  TeamView,
  UpdateTeamMembersRequest,
} from '@shared/models/team.model';
import { teamRoleName } from '@shared/utils/enum.util';
import { TeamApi } from '@features/teams/data-access/team-api.service';
import { UserDirectoryStore } from '@features/users/state/user-directory.store';

@Injectable({ providedIn: 'root' })
export class TeamsStore {
  private readonly api = inject(TeamApi);
  private readonly users = inject(UserDirectoryStore);
  private readonly recent = inject(RecentStore);

  private readonly _teams = signal<readonly TeamResult[]>([]);
  private readonly _currentTeam = signal<TeamResult | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly teams = this._teams.asReadonly();
  readonly currentTeam = this._currentTeam.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly recentTeams = this.recent.teams;
  readonly currentTeamView = computed<TeamView | null>(() => {
    const team = this._currentTeam();

    if (!team) {
      return null;
    }

    const users = this.users.usersByCode();

    return {
      ...team,
      members: team.members.map((member) => ({
        ...member,
        user: users.get(member.userCode) ?? null,
        roleName: teamRoleName(member.role),
      })),
    };
  });

  async loadMine(userCode: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const teams = await firstValueFrom(this.api.findByUser(userCode));
      this._teams.set(teams);
      await this.users.ensureLoaded(
        teams.flatMap((team) => team.members.map((member) => member.userCode)),
      );
    } catch (error) {
      const apiError = toApiError(error);

      if (apiError.kind === 'not-found' || apiError.kind === 'network') {
        await this.loadRecent();
      } else {
        this._error.set(apiError);
      }
    } finally {
      this._loading.set(false);
    }
  }

  async load(code: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const team = await firstValueFrom(this.api.findOne(code));
      this._currentTeam.set(team);
      this.recent.addTeam(team);
      await this.users.ensureLoaded(team.members.map((member) => member.userCode));
    } catch (error) {
      const apiError = toApiError(error);
      this._error.set(apiError);
      throw apiError;
    } finally {
      this._loading.set(false);
    }
  }

  async create(request: CreateTeamRequest): Promise<TeamResult> {
    const team = await firstValueFrom(this.api.create(request));
    this._currentTeam.set(team);
    this.recent.addTeam(team);
    this._teams.update((teams) => [team, ...teams.filter((item) => item.code !== team.code)]);
    await this.users.ensureLoaded(team.members.map((member) => member.userCode));
    return team;
  }

  async updateMembers(code: string, request: UpdateTeamMembersRequest): Promise<TeamResult> {
    const team = await firstValueFrom(this.api.updateMembers(code, request));
    this._currentTeam.set(team);
    this.recent.addTeam(team);
    this._teams.update((teams) => teams.map((item) => (item.code === team.code ? team : item)));
    await this.users.ensureLoaded(team.members.map((member) => member.userCode));
    return team;
  }

  clearCurrent(): void {
    this._currentTeam.set(null);
  }

  private async loadRecent(): Promise<void> {
    const recentTeams = this.recent.teams();

    if (recentTeams.length === 0) {
      this._teams.set([]);
      return;
    }

    const requests = recentTeams.map((team) =>
      this.api.findOne(team.code).pipe(catchError(() => of(null))),
    );

    const teams = (await firstValueFrom(forkJoin(requests))).filter(
      (team): team is TeamResult => team !== null,
    );

    this._teams.set(teams);
    await this.users.ensureLoaded(
      teams.flatMap((team) => team.members.map((member) => member.userCode)),
    );
  }
}
