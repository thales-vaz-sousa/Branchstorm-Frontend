import type { LinkStatus, LinkTypeName, LinkValidationName } from '@shared/models/link.model';
import type { TeamMemberRoleName } from '@shared/models/team.model';
import { translate } from '@core/i18n/i18n.service';
import type { LangCode } from '@core/i18n/dictionaries';

/**
 * Rótulos traduzidos por língua. Os dicionários vivem em `core/i18n`
 * (chaves `type.*`, `status.*`, `validation.*`, `role.*`).
 */

function label(key: string, lang: LangCode): string {
  return translate(key, lang);
}

export function linkTypeLabel(type: LinkTypeName, lang: LangCode): string {
  return label(`type.${type === 'Version' ? 'version' : String(type).toLowerCase()}`, lang);
}

export function linkStatusLabel(status: LinkStatus, lang: LangCode): string {
  return label(`status.${String(status).toLowerCase()}`, lang);
}

export function linkValidationLabel(validation: LinkValidationName, lang: LangCode): string {
  const key =
    validation === 'NotTested'
      ? 'validation.notTested'
      : validation === 'Validated'
        ? 'validation.validated'
        : 'validation.refuted';
  return label(key, lang);
}

export function roleLabel(role: TeamMemberRoleName, lang: LangCode): string {
  return label(`role.${String(role).toLowerCase()}`, lang);
}

export function roleDescription(role: TeamMemberRoleName, lang: LangCode): string {
  return label(`role.${String(role).toLowerCase()}.desc`, lang);
}

export const TEAM_ROLE_NAMES: readonly TeamMemberRoleName[] = [
  'Admin',
  'Owner',
  'Collaborator',
  'Evaluator',
];

const TEAM_ROLE_BY_VALUE: Readonly<Record<number, TeamMemberRoleName>> = {
  0: 'Admin',
  1: 'Owner',
  2: 'Collaborator',
  3: 'Evaluator',
};

export function teamRoleName(role: number): TeamMemberRoleName {
  return TEAM_ROLE_BY_VALUE[role] ?? 'Collaborator';
}
