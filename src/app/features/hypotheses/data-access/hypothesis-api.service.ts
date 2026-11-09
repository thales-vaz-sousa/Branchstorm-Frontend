import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import type {
  CreateHypothesisRequest,
  HypothesisResult,
  RegisterHypothesisResultRequest,
} from '@shared/models/hypothesis.model';

@Injectable({ providedIn: 'root' })
export class HypothesisApi {
  private readonly api = inject(ApiClient);

  list(linkCode: string): Observable<HypothesisResult[]> {
    return this.api.get<HypothesisResult[]>('/api/hypothesis', { linkCode });
  }

  create(request: CreateHypothesisRequest): Observable<HypothesisResult> {
    return this.api.post<HypothesisResult>('/api/hypothesis', request);
  }

  registerResult(
    code: string,
    request: RegisterHypothesisResultRequest,
  ): Observable<HypothesisResult> {
    return this.api.put<HypothesisResult>(`/api/hypothesis/result/${code}`, request);
  }
}
