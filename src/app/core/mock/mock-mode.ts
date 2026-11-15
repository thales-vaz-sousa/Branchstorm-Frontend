import { environment } from '@env/environment';

export type MockService = 'users' | 'teams' | 'ideas' | 'hypotheses' | 'feedback';

export const MOCK_SERVICES: readonly MockService[] = [
  'users',
  'teams',
  'ideas',
  'hypotheses',
  'feedback',
];

export const MOCK_KEYS: Readonly<Record<MockService, string>> = {
  users: 'bs.mock.users',
  teams: 'bs.mock.teams',
  ideas: 'bs.mock.ideas',
  hypotheses: 'bs.mock.hypotheses',
  feedback: 'bs.mock.feedback',
};

export const MOCK_DB_KEY = 'bs.mock.db.v3';

/** Produção sempre usa a API real; as flags só existem em desenvolvimento. */
export function isMockEnabled(service: MockService): boolean {
  if (!environment.useMocks) {
    return false;
  }

  const stored = localStorage.getItem(MOCK_KEYS[service]);
  return stored === null ? true : stored === 'true';
}

export function anyMockEnabled(): boolean {
  return MOCK_SERVICES.some((service) => isMockEnabled(service));
}

export function setMockEnabled(service: MockService, enabled: boolean): void {
  localStorage.setItem(MOCK_KEYS[service], String(enabled));
  window.location.reload();
}

export function resetMockData(): void {
  for (const key of Object.values(MOCK_KEYS)) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(MOCK_DB_KEY);
  window.location.reload();
}
