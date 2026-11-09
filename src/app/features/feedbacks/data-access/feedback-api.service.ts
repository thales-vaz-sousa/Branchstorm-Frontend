import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import type { CreateFeedbackRequest, FeedbackResult } from '@shared/models/feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackApi {
  private readonly api = inject(ApiClient);

  list(linkCode: string): Observable<FeedbackResult[]> {
    return this.api.get<FeedbackResult[]>('/api/feedbacks', { linkCode });
  }

  create(request: CreateFeedbackRequest): Observable<FeedbackResult> {
    return this.api.post<FeedbackResult>('/api/feedbacks', request);
  }
}
