import { HttpEventType, HttpRequest } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { LinkResult, LinkStatus } from '@shared/models/link.model';
import type { MockDatabase } from './mock-db';
import { getMockDatabase, resetMockDatabase, saveMockDatabase } from './mock-db';
import { handleMockRequest } from './mock-api.interceptor';

function link(code: string, fatherCode: string | null, status: LinkStatus): LinkResult {
  return {
    code,
    fatherCode,
    type: fatherCode ? 'Solution' : 'Problem',
    title: code,
    description: null,
    status,
    validation: 'NotTested',
    autorCode: 'user-pedro',
    teamCode: 'team-a',
    reason: null,
    creationDate: '2026-01-01T00:00:00.000Z',
    history: [],
  };
}

function fixture(): MockDatabase {
  return {
    users: [],
    teams: [],
    hypotheses: [],
    feedbacks: [],
    links: [
      link('root', null, 'Open'),
      link('a', 'root', 'Selected'),
      link('a1', 'a', 'Selected'),
      link('a2', 'a', 'Open'),
      link('b', 'root', 'Open'),
      link('b1', 'b', 'Open'),
      link('b2', 'b', 'Open'),
      link('b1x', 'b1', 'Open'),
      link('c', 'root', 'Open'),
      link('c-final', 'c', 'Final'),
    ],
  };
}

function url(path: string): URL {
  return new URL(`http://mock.test${path}`);
}

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const request = new HttpRequest(method, `http://mock.test${path}`, body);

  return firstValueFrom(handleMockRequest(request, url(path))).then((event) => {
    if (event.type !== HttpEventType.Response) {
      throw new Error('Evento inesperado no mock.');
    }

    return { status: event.status, body: event.body };
  });
}

describe('mock select/final/feedback rules', () => {
  beforeEach(() => {
    resetMockDatabase();
    saveMockDatabase(fixture());
  });

  it('select descarta irmãos e descendentes e mantém um por pai', async () => {
    await call('PUT', '/api/idea/select/b', { reason: null });

    const links = getMockDatabase().links;
    const statusByCode = new Map(links.map((item) => [item.code, item.status]));

    expect(statusByCode.get('b')).toBe('Selected');
    expect(statusByCode.get('root')).toBe('Selected');
    expect(statusByCode.get('a')).toBe('Discarded');
    expect(statusByCode.get('a1')).toBe('Discarded');
    expect(statusByCode.get('a2')).toBe('Discarded');
    expect(statusByCode.get('b1')).toBe('Open');
    expect(statusByCode.get('b2')).toBe('Open');
    expect(statusByCode.get('c')).toBe('Discarded');
    expect(statusByCode.get('c-final')).toBe('Final');

    const selectedChildrenOfRoot = links.filter(
      (item) => item.fatherCode === 'root' && item.status === 'Selected',
    );
    expect(selectedChildrenOfRoot.map((item) => item.code)).toEqual(['b']);
  });

  it('final só aceito para nó selecionado', async () => {
    await expect(
      call('PUT', '/api/idea/final/b', { reason: null }),
    ).rejects.toMatchObject({ status: 409 });

    await call('PUT', '/api/idea/final/a', { reason: 'motivo' });

    const links = getMockDatabase().links;
    expect(links.find((item) => item.code === 'a')?.status).toBe('Final');
    expect(links.find((item) => item.code === 'b')?.status).toBe('Open');
  });

  it('feedback só aceito em nó aberto', async () => {
    await expect(
      call('POST', '/api/feedbacks', {
        linkCode: 'a',
        autorCode: 'user-pedro',
        test: 'Comentário.',
        rating: 5,
      }),
    ).rejects.toMatchObject({ status: 409 });

    await call('POST', '/api/feedbacks', {
      linkCode: 'b',
      autorCode: 'user-pedro',
      test: 'Comentário válido.',
      rating: 4,
    });

    const database = getMockDatabase();
    expect(database.feedbacks).toHaveLength(1);
    expect(database.feedbacks[0]?.linkCode).toBe('b');
  });

  it('lote de usuários recusa mais de 100 códigos', async () => {
    const codes = Array.from({ length: 101 }, (_, index) => `user-${index}`);

    await expect(
      call('GET', `/api/user?${codes.map((code) => `codes=${code}`).join('&')}`),
    ).rejects.toMatchObject({ status: 400 });
  });
});
