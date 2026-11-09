import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { delay, type Observable, of, throwError } from 'rxjs';
import type { CreateFeedbackRequest } from '@shared/models/feedback.model';
import type {
  CreateHypothesisRequest,
  HypothesisResult,
  RegisterHypothesisResultRequest,
} from '@shared/models/hypothesis.model';
import type {
  CreateLinkRequest,
  LinkHistoryResult,
  LinkResult,
  MarkLinkFinalRequest,
  SelectLinkRequest,
  UpdateLinkValidationRequest,
} from '@shared/models/link.model';
import type {
  CreateTeamRequest,
  TeamResult,
  UpdateTeamMembersRequest,
} from '@shared/models/team.model';
import type { CreateUserRequest, UserResult } from '@shared/models/user.model';
import { getMockDatabase, linkTypeName, linkValidationName, saveMockDatabase } from './mock-db';
import { isMockEnabled, type MockService } from './mock-mode';
import { currentLang, translate } from '@core/i18n/i18n.service';
import type { LangParams } from '@core/i18n/dictionaries';

function t(key: string, params?: LangParams): string {
  return translate(key, currentLang(), params);
}

const SERVICE_BY_RESOURCE: Readonly<Record<string, MockService>> = {
  user: 'users',
  team: 'teams',
  idea: 'ideas',
  hypothesis: 'hypotheses',
  feedbacks: 'feedback',
};

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const url = new URL(request.url, window.location.origin);

  if (!url.pathname.startsWith('/api/')) {
    return next(request);
  }

  const resource = url.pathname.split('/').filter(Boolean)[1];
  const service = resource ? SERVICE_BY_RESOURCE[resource] : undefined;

  if (!service || !isMockEnabled(service)) {
    return next(request);
  }

  return handleRequest(request, url).pipe(delay(220));
};

/** Exportado para testes: despacha direto, sem o gating de `isMockEnabled`. */
export function handleMockRequest(
  request: HttpRequest<unknown>,
  url: URL,
): Observable<HttpEvent<unknown>> {
  return handleRequest(request, url);
}

function handleRequest(request: HttpRequest<unknown>, url: URL): Observable<HttpEvent<unknown>> {
  const database = getMockDatabase();
  const segments = url.pathname.split('/').filter(Boolean);
  const resource = segments[1];
  const id = segments[2];
  const action = segments[3];

  switch (resource) {
    case 'user':
      return handleUser(request, url, id, database);
    case 'team':
      return handleTeam(request, url, id, database);
    case 'idea':
      return handleIdea(request, url, id, action, database);
    case 'hypothesis':
      return handleHypothesis(request, url, id, action, database);
    case 'feedbacks':
      return handleFeedback(request, url, database);
    default:
      return fail(
        404,
        t('mock.endpointNotFound'),
        t('mock.endpointNotFoundDetail', { method: request.method, path: url.pathname }),
      );
  }
}

function handleUser(
  request: HttpRequest<unknown>,
  url: URL,
  id: string | undefined,
  database: ReturnType<typeof getMockDatabase>,
): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET' && !id) {
    const codes = url.searchParams.getAll('codes');

    if (codes.length > 100) {
      return fail(400, t('mock.limitExceeded'), t('mock.limitDetail'));
    }

    let users = [...database.users];

    if (codes.length > 0) {
      users = users.filter((user) => codes.includes(user.code));
    }

    const code = url.searchParams.get('code');
    const name = url.searchParams.get('name');
    const email = url.searchParams.get('email');

    if (code) {
      users = users.filter((user) => user.code === code);
    }

    if (name) {
      users = users.filter((user) => user.name.toLowerCase().includes(name.toLowerCase()));
    }

    if (email) {
      users = users.filter((user) => user.email.toLowerCase() === email.toLowerCase());
    }

    return json(users);
  }

  if (request.method === 'GET' && id) {
    const user = database.users.find((item) => item.code === id);
    return user ? json(user) : fail(404, t('mock.userNotFound'), t('mock.invalidCode'));
  }

  if (request.method === 'POST' && !id) {
    const body = request.body as CreateUserRequest;

    if (!body.name?.trim() || !body.email?.trim()) {
      return fail(400, t('mock.invalid'), t('mock.nameEmailRequired'));
    }

    if (!body.email.includes('@')) {
      return fail(400, t('mock.invalid'), t('mock.validEmail'));
    }

    if (database.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
      return fail(409, t('mock.emailTaken'), t('mock.emailTakenDetail'));
    }

    const user: UserResult = {
      code: crypto.randomUUID(),
      name: body.name.trim(),
      email: body.email.trim(),
    };

    database.users.push(user);
    saveMockDatabase(database);
    return json(user);
  }

  return fail(
    405,
    t('mock.methodDenied'),
    t('mock.methodDetail', { method: request.method, resource: 'user' }),
  );
}

function handleTeam(
  request: HttpRequest<unknown>,
  url: URL,
  id: string | undefined,
  database: ReturnType<typeof getMockDatabase>,
): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET' && !id) {
    const userCode = url.searchParams.get('userCode');
    const teams = userCode
      ? database.teams.filter((team) => team.members.some((member) => member.userCode === userCode))
      : database.teams;

    return json(teams);
  }

  if (request.method === 'GET' && id) {
    const team = database.teams.find((item) => item.code === id);
    return team ? json(team) : fail(404, t('mock.teamNotFound'), t('mock.invalidCode'));
  }

  if (request.method === 'POST' && !id) {
    const body = request.body as CreateTeamRequest;

    if (!body.name?.trim()) {
      return fail(400, t('mock.invalid'), t('mock.teamNameRequired'));
    }

    const code = crypto.randomUUID();
    const team: TeamResult = {
      code,
      name: body.name.trim(),
      members: (body.members ?? []).map((member) => ({
        teamCode: code,
        userCode: member.userCode,
        role: member.role,
      })),
    };

    database.teams.push(team);
    saveMockDatabase(database);
    return json(team);
  }

  if (request.method === 'PATCH' && id) {
    const body = request.body as UpdateTeamMembersRequest;
    const team = database.teams.find((item) => item.code === id);

    if (!team) {
      return fail(404, t('mock.teamNotFound'), t('mock.invalidCode'));
    }

    const updated: TeamResult = {
      ...team,
      name: body.name?.trim() || team.name,
      members: (body.members ?? team.members).map((member) => ({
        ...member,
        teamCode: team.code,
      })),
    };

    database.teams = database.teams.map((item) => (item.code === id ? updated : item));
    saveMockDatabase(database);
    return json(updated);
  }

  return fail(
    405,
    t('mock.methodDenied'),
    t('mock.methodDetail', { method: request.method, resource: 'team' }),
  );
}

function handleIdea(
  request: HttpRequest<unknown>,
  url: URL,
  id: string | undefined,
  action: string | undefined,
  database: ReturnType<typeof getMockDatabase>,
): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET' && !id) {
    const teamCode = url.searchParams.get('teamCode');
    const roots = database.links.filter(
      (link) => !link.fatherCode && (!teamCode || link.teamCode === teamCode),
    );

    return json(roots);
  }

  if (request.method === 'POST' && !id) {
    const body = request.body as CreateLinkRequest;
    const type = linkTypeName(body.type);

    if (!body.title?.trim()) {
      return fail(400, t('mock.invalid'), t('mock.titleRequired'));
    }

    if (type === 'Problem' && body.fatherCode) {
      return fail(400, t('mock.invalid'), t('mock.problemNoParent'));
    }

    if (type !== 'Problem' && !body.fatherCode) {
      return fail(400, t('mock.invalid'), t('mock.solutionNeedsParent'));
    }

    if (body.fatherCode && !database.links.some((link) => link.code === body.fatherCode)) {
      return fail(400, t('mock.invalid'), t('mock.parentMissing'));
    }

    const code = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const link: LinkResult = {
      code,
      fatherCode: body.fatherCode ?? null,
      type,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      status: 'Open',
      validation: 'NotTested',
      autorCode: body.autorCode ?? null,
      teamCode: body.teamCode ?? null,
      reason: body.reason?.trim() || null,
      creationDate: createdAt,
      history: [
        {
          code: crypto.randomUUID(),
          linkCode: code,
          event: `Created as ${type}`,
          creationDate: createdAt,
        },
      ],
    };

    database.links.push(link);
    saveMockDatabase(database);
    return json(link);
  }

  if (request.method === 'GET' && id === 'tree' && action) {
    const root = database.links.find((link) => link.code === action);

    if (!root) {
      return fail(404, t('mock.rootNotFound'), t('mock.rootNotFoundDetail'));
    }

    return json(collectTree(database.links, action));
  }

  if (request.method === 'GET' && id) {
    const link = database.links.find((item) => item.code === id);
    return link ? json(link) : fail(404, t('mock.nodeNotFound'), t('mock.invalidCode'));
  }

  if (request.method === 'PUT' && id === 'select' && action) {
    const body = (request.body ?? {}) as SelectLinkRequest;
    return selectLink(database, action, body.reason ?? null);
  }

  if (request.method === 'PUT' && id === 'validation' && action) {
    const body = request.body as UpdateLinkValidationRequest;
    return updateValidation(database, action, body);
  }

  if (request.method === 'PUT' && id === 'final' && action) {
    const body = (request.body ?? {}) as MarkLinkFinalRequest;
    return markFinal(database, action, body.reason ?? null);
  }

  return fail(
    405,
    t('mock.methodDenied'),
    t('mock.methodDetail', { method: request.method, resource: 'idea' }),
  );
}

function handleHypothesis(
  request: HttpRequest<unknown>,
  url: URL,
  id: string | undefined,
  action: string | undefined,
  database: ReturnType<typeof getMockDatabase>,
): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET' && !id) {
    const linkCode = url.searchParams.get('linkCode');
    const hypotheses = linkCode
      ? database.hypotheses.filter((hypothesis) => hypothesis.linkCode === linkCode)
      : database.hypotheses;

    return json(hypotheses);
  }

  if (request.method === 'POST' && !id) {
    const body = request.body as CreateHypothesisRequest;

    if (!body.linkCode || !body.description?.trim() || !body.successCriteria?.trim()) {
      return fail(400, t('mock.invalid'), t('mock.hypoFields'));
    }

    if (!database.links.some((link) => link.code === body.linkCode)) {
      return fail(400, t('mock.invalid'), t('mock.nodeMissing'));
    }

    const hypothesis: HypothesisResult = {
      code: crypto.randomUUID(),
      linkCode: body.linkCode,
      description: body.description.trim(),
      successCriteria: body.successCriteria.trim(),
      result: null,
      creationDate: new Date().toISOString(),
    };

    database.hypotheses.push(hypothesis);
    saveMockDatabase(database);
    return json(hypothesis);
  }

  if (request.method === 'PUT' && id === 'result' && action) {
    const body = request.body as RegisterHypothesisResultRequest;
    const hypothesis = database.hypotheses.find((item) => item.code === action);

    if (!hypothesis) {
      return fail(404, t('mock.hypothesisNotFound'), t('mock.invalidCode'));
    }

    if (body.result !== 'Validated' && body.result !== 'Refuted') {
      return fail(400, t('mock.invalid'), t('mock.resultChoice'));
    }

    const updatedHypothesis: HypothesisResult = { ...hypothesis, result: body.result };

    database.hypotheses = database.hypotheses.map((item) =>
      item.code === action ? updatedHypothesis : item,
    );

    database.links = database.links.map((link) => {
      if (link.code !== updatedHypothesis.linkCode) {
        return link;
      }

      return addHistory(
        { ...link, validation: body.result === 'Validated' ? 'Validated' : 'Refuted' },
        `Validation updated to ${body.result}${body.reason ? `: ${body.reason}` : ''}`,
      );
    });

    saveMockDatabase(database);
    return json(updatedHypothesis);
  }

  return fail(
    405,
    t('mock.methodDenied'),
    t('mock.methodDetail', { method: request.method, resource: 'hypothesis' }),
  );
}

function handleFeedback(
  request: HttpRequest<unknown>,
  url: URL,
  database: ReturnType<typeof getMockDatabase>,
): Observable<HttpEvent<unknown>> {
  if (request.method === 'GET') {
    const linkCode = url.searchParams.get('linkCode');
    const feedbacks = linkCode
      ? database.feedbacks.filter((feedback) => feedback.linkCode === linkCode)
      : database.feedbacks;

    return json(feedbacks);
  }

  if (request.method === 'POST') {
    const body = request.body as CreateFeedbackRequest;
    const link = database.links.find((item) => item.code === body.linkCode);

    if (!link) {
      return fail(400, t('mock.invalid'), t('mock.nodeMissing'));
    }

    if (link.status !== 'Open') {
      return fail(409, t('mock.feedbackDenied'), t('mock.feedbackDeniedDetail'));
    }

    if (!body.test?.trim() || body.rating < 1 || body.rating > 5) {
      return fail(400, t('mock.invalid'), t('mock.invalidFeedback'));
    }

    const feedback = {
      code: crypto.randomUUID(),
      linkCode: body.linkCode,
      autorCode: body.autorCode,
      test: body.test.trim(),
      rating: body.rating,
      creationDate: new Date().toISOString(),
    };

    database.feedbacks.push(feedback);
    saveMockDatabase(database);
    return json(feedback);
  }

  return fail(
    405,
    t('mock.methodDenied'),
    t('mock.methodDetail', { method: request.method, resource: 'feedbacks' }),
  );
}

function collectTree(links: readonly LinkResult[], rootCode: string): readonly LinkResult[] {
  const result: LinkResult[] = [];
  const queue: string[] = [rootCode];

  while (queue.length > 0) {
    const code = queue.shift();

    if (!code) {
      break;
    }

    const link = links.find((item) => item.code === code);

    if (!link) {
      continue;
    }

    result.push(link);

    for (const child of links.filter((item) => item.fatherCode === code)) {
      queue.push(child.code);
    }
  }

  return result;
}

function selectLink(
  database: ReturnType<typeof getMockDatabase>,
  code: string,
  reason: string | null,
): Observable<HttpEvent<unknown>> {
  const link = database.links.find((item) => item.code === code);

  if (!link) {
    return fail(404, t('mock.nodeNotFound'), t('mock.invalidCode'));
  }

  const selectedAncestors = new Set<string>();
  let cursor: string | null = link.fatherCode;

  while (cursor) {
    selectedAncestors.add(cursor);
    cursor = database.links.find((item) => item.code === cursor)?.fatherCode ?? null;
  }

  const discarded = new Set<string>();

  for (const sibling of database.links.filter(
    (item) => item.fatherCode === link.fatherCode && item.code !== code,
  )) {
    if (sibling.status === 'Final') {
      continue;
    }

    discarded.add(sibling.code);
    const queue = [sibling.code];

    while (queue.length > 0) {
      const parent = queue.shift();

      if (!parent) {
        continue;
      }

      for (const child of database.links.filter((item) => item.fatherCode === parent)) {
        if (child.status !== 'Final') {
          discarded.add(child.code);
        }
        queue.push(child.code);
      }
    }
  }

  database.links = database.links.map((item) => {
    if (item.code === code) {
      return addHistory(
        { ...item, status: 'Selected' },
        reason ? `Selected: ${reason}` : 'Selected',
      );
    }

    if (discarded.has(item.code)) {
      return addHistory(
        { ...item, status: 'Discarded' },
        `Discarded: sibling ${code} was selected`,
      );
    }

    if (selectedAncestors.has(item.code) && item.status !== 'Final' && item.status !== 'Selected') {
      return addHistory({ ...item, status: 'Selected' }, `Selected: ancestor of ${code}`);
    }

    return item;
  });

  saveMockDatabase(database);
  return json(database.links.find((item) => item.code === code));
}

function updateValidation(
  database: ReturnType<typeof getMockDatabase>,
  code: string,
  body: UpdateLinkValidationRequest,
): Observable<HttpEvent<unknown>> {
  const link = database.links.find((item) => item.code === code);

  if (!link) {
    return fail(404, t('mock.nodeNotFound'), t('mock.invalidCode'));
  }

  const validation = linkValidationName(body.validation);

  database.links = database.links.map((item) =>
    item.code === code
      ? addHistory(
          { ...item, validation },
          body.reason
            ? `Validation updated to ${validation}: ${body.reason}`
            : `Validation updated to ${validation}`,
        )
      : item,
  );

  saveMockDatabase(database);
  return json(database.links.find((item) => item.code === code));
}

function markFinal(
  database: ReturnType<typeof getMockDatabase>,
  code: string,
  reason: string | null,
): Observable<HttpEvent<unknown>> {
  const link = database.links.find((item) => item.code === code);

  if (!link) {
    return fail(404, t('mock.nodeNotFound'), t('mock.invalidCode'));
  }

  if (link.status !== 'Selected') {
    return fail(409, t('mock.finalDenied'), t('mock.finalDeniedDetail'));
  }

  database.links = database.links.map((item) =>
    item.code === code
      ? addHistory(
          { ...item, status: 'Final' },
          reason ? `Marked as final: ${reason}` : 'Marked as final',
        )
      : item,
  );

  saveMockDatabase(database);
  return json(database.links.find((item) => item.code === code));
}

function addHistory(link: LinkResult, event: string): LinkResult {
  const entry: LinkHistoryResult = {
    code: crypto.randomUUID(),
    linkCode: link.code,
    event,
    creationDate: new Date().toISOString(),
  };

  return { ...link, history: [...link.history, entry] };
}

function json<T>(body: T, status = 200): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status, body }));
}

function fail(status: number, title: string, detail: string): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        error: { title, detail, status },
      }),
  );
}
