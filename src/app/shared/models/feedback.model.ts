export interface FeedbackResult {
  readonly code: string;
  readonly linkCode: string;
  readonly autorCode: string;
  readonly test: string;
  readonly rating: number;
  readonly creationDate: string;
}

export interface CreateFeedbackRequest {
  readonly linkCode: string;
  readonly autorCode: string;
  readonly test: string;
  readonly rating: number;
}
