import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import type {
  CreateTeamRequest,
  TeamResult,
  UpdateTeamMembersRequest,
} from '@shared/models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamApi {
  private readonly api = inject(ApiClient);

  findAll(): Observable<TeamResult[]> {
    return this.api.get<TeamResult[]>('/api/team');
  }

  findByUser(userCode: string): Observable<TeamResult[]> {
    return this.api.get<TeamResult[]>('/api/team', { userCode });
  }

  findOne(code: string): Observable<TeamResult> {
    return this.api.get<TeamResult>(`/api/team/${code}`);
  }

  create(request: CreateTeamRequest): Observable<TeamResult> {
    return this.api.post<TeamResult>('/api/team', request);
  }

  updateMembers(code: string, request: UpdateTeamMembersRequest): Observable<TeamResult> {
    return this.api.patch<TeamResult>(`/api/team/${code}`, request);
  }
}
