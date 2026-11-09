import { computed, Injectable, signal } from '@angular/core';
import type { LinkResult, RecentIdea } from '@shared/models/link.model';
import type { TeamResult } from '@shared/models/team.model';

export interface RecentTeam {
  readonly code: string;
  readonly name: string;
  readonly lastOpenedAt: string;
}

const RECENT_TEAMS_KEY = 'bs.recent.teams';
const RECENT_IDEAS_KEY = 'bs.recent.ideas';
const MAX_RECENT = 8;

@Injectable({ providedIn: 'root' })
export class RecentStore {
  private readonly _teams = signal<readonly RecentTeam[]>(this.read<RecentTeam>(RECENT_TEAMS_KEY));
  private readonly _ideas = signal<readonly RecentIdea[]>(this.read<RecentIdea>(RECENT_IDEAS_KEY));

  readonly teams = this._teams.asReadonly();
  readonly ideas = this._ideas.asReadonly();
  readonly hasTeams = computed(() => this._teams().length > 0);
  readonly hasIdeas = computed(() => this._ideas().length > 0);

  addTeam(team: TeamResult): void {
    const next: RecentTeam[] = [
      { code: team.code, name: team.name, lastOpenedAt: new Date().toISOString() },
      ...this._teams().filter((item) => item.code !== team.code),
    ].slice(0, MAX_RECENT);

    this._teams.set(next);
    this.write(RECENT_TEAMS_KEY, next);
  }

  addIdea(link: LinkResult): void {
    const next: RecentIdea[] = [
      {
        code: link.code,
        title: link.title,
        teamCode: link.teamCode,
        lastOpenedAt: new Date().toISOString(),
      },
      ...this._ideas().filter((item) => item.code !== link.code),
    ].slice(0, MAX_RECENT);

    this._ideas.set(next);
    this.write(RECENT_IDEAS_KEY, next);
  }

  removeIdea(code: string): void {
    const next = this._ideas().filter((item) => item.code !== code);
    this._ideas.set(next);
    this.write(RECENT_IDEAS_KEY, next);
  }

  clearIdeas(): void {
    this._ideas.set([]);
    this.write(RECENT_IDEAS_KEY, []);
  }

  private read<T>(key: string): readonly T[] {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  }

  private write(key: string, value: readonly unknown[]): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
