import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable, of } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import type { CreateUserRequest, FindUsersQuery, UserResult } from '@shared/models/user.model';
import { chunk } from '@shared/utils/collection.util';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly api = inject(ApiClient);

  find(query: FindUsersQuery = {}): Observable<UserResult[]> {
    return this.api.get<UserResult[]>('/api/user', {
      code: query.code,
      name: query.name,
      email: query.email,
      codes: query.codes,
    });
  }

  findOne(code: string): Observable<UserResult> {
    return this.api.get<UserResult>(`/api/user/${code}`);
  }

  create(request: CreateUserRequest): Observable<UserResult> {
    return this.api.post<UserResult>('/api/user', request);
  }

  findByCodes(codes: readonly string[]): Observable<UserResult[]> {
    const uniqueCodes = [...new Set(codes)];

    if (uniqueCodes.length === 0) {
      return of([]);
    }

    const requests = chunk(uniqueCodes, 100).map((part) => this.find({ codes: part }));

    return forkJoin(requests).pipe(map((results) => results.flat()));
  }
}
