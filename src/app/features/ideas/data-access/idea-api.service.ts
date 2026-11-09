import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import type {
  CreateLinkRequest,
  LinkResult,
  MarkLinkFinalRequest,
  SelectLinkRequest,
} from '@shared/models/link.model';

@Injectable({ providedIn: 'root' })
export class IdeaApi {
  private readonly api = inject(ApiClient);

  findRoots(teamCode?: string): Observable<LinkResult[]> {
    return this.api.get<LinkResult[]>('/api/idea', { teamCode });
  }

  findOne(code: string): Observable<LinkResult> {
    return this.api.get<LinkResult>(`/api/idea/${code}`);
  }

  findTree(rootCode: string): Observable<LinkResult[]> {
    return this.api.get<LinkResult[]>(`/api/idea/tree/${rootCode}`);
  }

  create(request: CreateLinkRequest): Observable<LinkResult> {
    return this.api.post<LinkResult>('/api/idea', request);
  }

  select(code: string, request: SelectLinkRequest = {}): Observable<LinkResult> {
    return this.api.put<LinkResult>(`/api/idea/select/${code}`, request);
  }

  markFinal(code: string, request: MarkLinkFinalRequest = {}): Observable<LinkResult> {
    return this.api.put<LinkResult>(`/api/idea/final/${code}`, request);
  }
}
