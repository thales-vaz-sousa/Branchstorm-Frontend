import type { UserResult } from './user.model';

export const TeamMemberRole = {
  Admin: 0,
  Owner: 1,
  Collaborator: 2,
  Evaluator: 3,
} as const;

export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];
export type TeamMemberRoleName = 'Admin' | 'Owner' | 'Collaborator' | 'Evaluator';

export interface TeamMember {
  readonly teamCode?: string | null;
  readonly userCode: string;
  readonly role: TeamMemberRole;
}

export interface TeamResult {
  readonly code: string;
  readonly name: string;
  readonly members: readonly TeamMember[];
}

export interface CreateTeamRequest {
  readonly name: string;
  readonly members: readonly TeamMember[];
}

export interface UpdateTeamMembersRequest {
  readonly name: string;
  readonly members: readonly TeamMember[];
}

export interface TeamMemberView extends TeamMember {
  readonly user: UserResult | null;
  readonly roleName: TeamMemberRoleName;
}

export interface TeamView extends TeamResult {
  readonly members: readonly TeamMemberView[];
}
