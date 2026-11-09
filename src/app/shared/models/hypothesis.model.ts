export interface HypothesisResult {
  readonly code: string;
  readonly linkCode: string;
  readonly description: string;
  readonly successCriteria: string;
  readonly result: 'Validated' | 'Refuted' | null;
  readonly creationDate: string;
}

export interface CreateHypothesisRequest {
  readonly linkCode: string;
  readonly description: string;
  readonly successCriteria: string;
}

export interface RegisterHypothesisResultRequest {
  readonly result: 'Validated' | 'Refuted';
  readonly reason?: string | null;
}
