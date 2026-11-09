export const LinkType = {
  Problem: 0,
  Solution: 1,
  Version: 2,
} as const;

export type LinkType = (typeof LinkType)[keyof typeof LinkType];
export type LinkTypeName = 'Problem' | 'Solution' | 'Version';

export const LinkStatus = {
  Open: 'Open',
  Selected: 'Selected',
  Discarded: 'Discarded',
  Final: 'Final',
} as const;

export type LinkStatus = (typeof LinkStatus)[keyof typeof LinkStatus];

export const LinkValidation = {
  NotTested: 0,
  Validated: 1,
  Refuted: 2,
} as const;

export type LinkValidation = (typeof LinkValidation)[keyof typeof LinkValidation];
export type LinkValidationName = 'NotTested' | 'Validated' | 'Refuted';

export interface LinkHistoryResult {
  readonly code: string;
  readonly linkCode: string;
  readonly event: string;
  readonly creationDate: string;
}

export interface LinkResult {
  readonly code: string;
  readonly fatherCode: string | null;
  readonly type: LinkTypeName;
  readonly title: string;
  readonly description: string | null;
  readonly status: LinkStatus;
  readonly validation: LinkValidationName;
  readonly autorCode: string | null;
  readonly teamCode: string | null;
  readonly reason: string | null;
  readonly creationDate: string;
  readonly history: readonly LinkHistoryResult[];
}

export interface CreateLinkRequest {
  readonly fatherCode?: string | null;
  readonly type: LinkType;
  readonly title: string;
  readonly description?: string | null;
  readonly autorCode?: string | null;
  readonly teamCode?: string | null;
  readonly reason?: string | null;
}

export interface SelectLinkRequest {
  readonly reason?: string | null;
}

export interface UpdateLinkValidationRequest {
  readonly validation: LinkValidation;
  readonly reason?: string | null;
}

export interface MarkLinkFinalRequest {
  readonly reason?: string | null;
}

export interface RecentIdea {
  readonly code: string;
  readonly title: string;
  readonly teamCode: string | null;
  readonly lastOpenedAt: string;
}
