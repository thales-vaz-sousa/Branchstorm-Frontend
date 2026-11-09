import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { UserResult } from '@shared/models/user.model';
import { UserApi } from './user-api.service';

function user(code: string): UserResult {
  return { code, name: `Usuário ${code}`, email: `${code}@example.test` };
}

describe('UserApi.findByCodes (lote de usuários)', () => {
  let api: UserApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(UserApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('divide 250 códigos em chamadas de no máximo 100', async () => {
    const codes = Array.from({ length: 250 }, (_, index) => `user-${index}`);
    const promise = firstValueFrom(api.findByCodes(codes));

    const requests = http.match((req) => req.url.endsWith('/api/user'));
    expect(requests).toHaveLength(3);

    const sizes = requests.map(
      (request) => request.request.params.getAll('codes')?.length ?? 0,
    );
    expect(sizes).toEqual([100, 100, 50]);

    for (const request of requests) {
      const codes = request.request.params.getAll('codes') ?? [];
      request.flush(codes.map((code) => user(code)));
    }

    const result = await promise;
    expect(result).toHaveLength(250);
    expect(result[0]?.code).toBe('user-0');
    expect(result[249]?.code).toBe('user-249');
  });

  it('não chama a API quando a lista é vazia', async () => {
    const result = await firstValueFrom(api.findByCodes([]));

    expect(result).toEqual([]);
    http.expectNone((req) => req.url.endsWith('/api/user'));
  });

  it('remove duplicados antes de chamar', async () => {
    const promise = firstValueFrom(api.findByCodes(['a', 'a', 'b']));

    const request = http.expectOne((req) => req.url.endsWith('/api/user'));
    expect(request.request.params.getAll('codes')).toEqual(['a', 'b']);
    request.flush([user('a'), user('b')]);

    expect(await promise).toHaveLength(2);
  });
});
