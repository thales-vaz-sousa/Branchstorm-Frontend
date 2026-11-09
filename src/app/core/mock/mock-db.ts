import type { FeedbackResult } from '@shared/models/feedback.model';
import type { HypothesisResult } from '@shared/models/hypothesis.model';
import type {
  LinkHistoryResult,
  LinkResult,
  LinkStatus,
  LinkTypeName,
  LinkValidationName,
} from '@shared/models/link.model';
import type { TeamResult } from '@shared/models/team.model';
import type { UserResult } from '@shared/models/user.model';
import { MOCK_DB_KEY } from './mock-mode';

export interface MockDatabase {
  users: UserResult[];
  teams: TeamResult[];
  links: LinkResult[];
  hypotheses: HypothesisResult[];
  feedbacks: FeedbackResult[];
}

let cache: MockDatabase | null = null;

export function getMockDatabase(): MockDatabase {
  if (cache) {
    return cache;
  }

  const raw = localStorage.getItem(MOCK_DB_KEY);

  if (raw) {
    try {
      cache = JSON.parse(raw) as MockDatabase;
      return cache;
    } catch {
      localStorage.removeItem(MOCK_DB_KEY);
    }
  }

  cache = seedDatabase();
  saveMockDatabase(cache);
  return cache;
}

export function saveMockDatabase(database: MockDatabase): void {
  cache = database;
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(database));
}

export function resetMockDatabase(): void {
  cache = null;
  localStorage.removeItem(MOCK_DB_KEY);
}

function seedDatabase(): MockDatabase {
  const now = Date.now();
  const minutesAgo = (minutes: number): string => new Date(now - minutes * 60_000).toISOString();

  const users: UserResult[] = [
    { code: 'user-pedro', name: 'Pedro Pavei', email: 'pedro@branchstorm.tech' },
    { code: 'user-matheus', name: 'Matheus Cechinel', email: 'matheus@branchstorm.tech' },
    { code: 'user-thales', name: 'Thales Vaz', email: 'thales@branchstorm.tech' },
    { code: 'user-ana', name: 'Ana Souza', email: 'ana@branchstorm.tech' },
  ];

  const teams: TeamResult[] = [
    {
      code: 'team-branchstorm',
      name: 'Branchstorm',
      members: [
        { teamCode: 'team-branchstorm', userCode: 'user-pedro', role: 0 },
        { teamCode: 'team-branchstorm', userCode: 'user-matheus', role: 1 },
        { teamCode: 'team-branchstorm', userCode: 'user-thales', role: 2 },
        { teamCode: 'team-branchstorm', userCode: 'user-ana', role: 3 },
      ],
    },
    {
      code: 'team-satc',
      name: 'SATC Inovação',
      members: [
        { teamCode: 'team-satc', userCode: 'user-ana', role: 1 },
        { teamCode: 'team-satc', userCode: 'user-pedro', role: 2 },
      ],
    },
  ];

  const links: LinkResult[] = [
    seedLink({
      code: 'link-refeitorio',
      fatherCode: null,
      type: 'Problem',
      title: 'Reduzir o desperdício no refeitório',
      description:
        'Estudantes deixam comida no prato porque não sabem o cardápio do dia e não conseguem planejar a refeição.',
      status: 'Open',
      validation: 'NotTested',
      autorCode: 'user-pedro',
      teamCode: 'team-branchstorm',
      reason: 'Dor observada em entrevistas com 24 estudantes.',
      creationDate: minutesAgo(240),
    }),
    seedLink({
      code: 'link-app-reserva',
      fatherCode: 'link-refeitorio',
      type: 'Solution',
      title: 'Aplicativo de reserva de refeições',
      description: 'O estudante reserva a refeição com antecedência e o refeitório prepara apenas o necessário.',
      status: 'Selected',
      validation: 'NotTested',
      autorCode: 'user-thales',
      teamCode: 'team-branchstorm',
      reason: 'Menor custo de implantação e impacto direto na produção.',
      creationDate: minutesAgo(200),
    }),
    seedLink({
      code: 'link-porcoes',
      fatherCode: 'link-refeitorio',
      type: 'Solution',
      title: 'Servir porções menores',
      description: 'Reduzir a porção padrão e permitir repetição.',
      status: 'Discarded',
      validation: 'Refuted',
      autorCode: 'user-matheus',
      teamCode: 'team-branchstorm',
      reason: 'Aumenta o retrabalho e piora a experiência no horário de pico.',
      creationDate: minutesAgo(190),
    }),
    seedLink({
      code: 'link-doacao',
      fatherCode: 'link-refeitorio',
      type: 'Solution',
      title: 'Doação das sobras',
      description: 'Destinar as sobras para uma organização parceira.',
      status: 'Discarded',
      validation: 'NotTested',
      autorCode: 'user-ana',
      teamCode: 'team-branchstorm',
      reason: 'Exige logística de transporte e adequação sanitária.',
      creationDate: minutesAgo(180),
    }),
    seedLink({
      code: 'link-reserva-1dia',
      fatherCode: 'link-app-reserva',
      type: 'Version',
      title: 'Reserva com 1 dia de antecedência',
      description: 'Reserva fecha às 18h do dia anterior.',
      status: 'Selected',
      validation: 'Validated',
      autorCode: 'user-thales',
      teamCode: 'team-branchstorm',
      reason: 'Equilíbrio entre previsibilidade para o refeitório e flexibilidade para o estudante.',
      creationDate: minutesAgo(150),
    }),
    seedLink({
      code: 'link-reserva-2dias',
      fatherCode: 'link-app-reserva',
      type: 'Version',
      title: 'Reserva com 2 dias de antecedência',
      description: 'Reserva fecha com 48 horas de antecedência.',
      status: 'Discarded',
      validation: 'Refuted',
      autorCode: 'user-matheus',
      teamCode: 'team-branchstorm',
      reason: 'Muitos estudantes esquecem de reservar e o desperdício aumenta.',
      creationDate: minutesAgo(140),
    }),
    seedLink({
      code: 'link-final',
      fatherCode: 'link-reserva-1dia',
      type: 'Version',
      title: 'Solução final: reserva com 1 dia + lembrete',
      description: 'Reserva com 1 dia de antecedência e lembrete no aplicativo às 17h.',
      status: 'Final',
      validation: 'Validated',
      autorCode: 'user-pedro',
      teamCode: 'team-branchstorm',
      reason: 'Hipótese validada e feedback positivo dos avaliadores.',
      creationDate: minutesAgo(120),
    }),
    seedLink({
      code: 'link-mentoria',
      fatherCode: null,
      type: 'Problem',
      title: 'Mapear temas de inovação para o TCC',
      description: 'Estudantes têm dificuldade de transformar áreas de interesse em temas de TCC relevantes.',
      status: 'Open',
      validation: 'NotTested',
      autorCode: 'user-ana',
      teamCode: 'team-satc',
      reason: 'Demanda recorrente na disciplina de projeto final.',
      creationDate: minutesAgo(90),
    }),
    seedLink({
      code: 'link-ia-temas',
      fatherCode: 'link-mentoria',
      type: 'Solution',
      title: 'Assistente de temas com IA',
      description: 'Sugere temas a partir de interesses, disciplinas e tendências de mercado.',
      status: 'Open',
      validation: 'NotTested',
      autorCode: 'user-pedro',
      teamCode: 'team-satc',
      reason: 'Baixo esforço para gerar alternativas e validar rapidamente.',
      creationDate: minutesAgo(60),
    }),
    seedLink({
      code: 'link-workshop',
      fatherCode: 'link-mentoria',
      type: 'Solution',
      title: 'Workshop de descoberta de temas',
      description: 'Encontro guiado para mapear problemas reais com estudantes e professores.',
      status: 'Open',
      validation: 'NotTested',
      autorCode: 'user-thales',
      teamCode: 'team-satc',
      reason: 'Gera contexto e validação humana antes de investir em tecnologia.',
      creationDate: minutesAgo(45),
    }),
  ];

  const hypotheses: HypothesisResult[] = [
    {
      code: 'hyp-reserva-1dia',
      linkCode: 'link-reserva-1dia',
      description: 'Reservas com 1 dia de antecedência reduzem as sobras em pelo menos 30%.',
      successCriteria: 'Sobras abaixo de 10% por duas semanas consecutivas.',
      result: 'Validated',
      creationDate: minutesAgo(110),
    },
    {
      code: 'hyp-reserva-2dias',
      linkCode: 'link-reserva-2dias',
      description: 'Reservas com 2 dias reduzem as sobras sem perder adesão.',
      successCriteria: 'Mais de 70% dos estudantes reservando e sobras abaixo de 10%.',
      result: 'Refuted',
      creationDate: minutesAgo(100),
    },
    {
      code: 'hyp-ia-temas',
      linkCode: 'link-ia-temas',
      description: 'Um assistente de IA aumenta a quantidade de temas considerados relevantes.',
      successCriteria: 'Pelo menos 3 temas aprovados por estudante em uma sessão.',
      result: null,
      creationDate: minutesAgo(30),
    },
  ];

  const feedbacks: FeedbackResult[] = [
    {
      code: 'fb-refeitorio-1',
      linkCode: 'link-refeitorio',
      autorCode: 'user-ana',
      test: 'Problema muito relevante e fácil de observar no dia a dia.',
      rating: 5,
      creationDate: minutesAgo(80),
    },
    {
      code: 'fb-refeitorio-2',
      linkCode: 'link-refeitorio',
      autorCode: 'user-matheus',
      test: 'Vale investigar também o impacto do horário de pico.',
      rating: 4,
      creationDate: minutesAgo(70),
    },
    {
      code: 'fb-ia-temas-1',
      linkCode: 'link-ia-temas',
      autorCode: 'user-thales',
      test: 'A ideia é promissora, mas precisa de critérios claros de avaliação.',
      rating: 4,
      creationDate: minutesAgo(20),
    },
  ];

  return { users, teams, links, hypotheses, feedbacks };
}

function seedLink(
  input: Omit<LinkResult, 'history'> & { readonly history?: readonly LinkHistoryResult[] },
): LinkResult {
  return {
    ...input,
    history: input.history ?? [
      {
        code: `hist-${input.code}-created`,
        linkCode: input.code,
        event: `Created as ${input.type}`,
        creationDate: input.creationDate,
      },
    ],
  };
}

export function linkStatus(value: string): LinkStatus {
  if (value === 'Open' || value === 'Selected' || value === 'Discarded' || value === 'Final') {
    return value;
  }

  return 'Open';
}

export function linkTypeName(value: number): LinkTypeName {
  if (value === 1) {
    return 'Solution';
  }

  if (value === 2) {
    return 'Version';
  }

  return 'Problem';
}

export function linkValidationName(value: number): LinkValidationName {
  if (value === 1) {
    return 'Validated';
  }

  if (value === 2) {
    return 'Refuted';
  }

  return 'NotTested';
}
