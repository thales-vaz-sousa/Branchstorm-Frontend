import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { ApiError, toApiError } from './api-error';

function httpError(status: number, body: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('toApiError', () => {
  it('mapeia problem+json de validação preservando os erros por campo', () => {
    const error = toApiError(
      httpError(400, {
        status: 400,
        title: 'Dados inválidos',
        detail: 'Verifique os campos marcados.',
        errors: { title: ['O título é obrigatório.'] },
      }),
    );

    expect(error.kind).toBe('validation');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Verifique os campos marcados.');
    expect(error.fieldErrors).toEqual({ title: ['O título é obrigatório.'] });
  });

  it('mapeia 404 para não encontrado', () => {
    const error = toApiError(httpError(404, { title: 'Nó não encontrado' }));

    expect(error.kind).toBe('not-found');
    expect(error.message).toBe('Nó não encontrado');
  });

  it('mapeia 409 para conflito', () => {
    const error = toApiError(httpError(409, { title: 'Já existe' }));

    expect(error.kind).toBe('conflict');
    expect(error.message).toBe('Já existe');
  });

  it('mapeia 5xx para servidor', () => {
    const error = toApiError(
      httpError(503, { status: 503, title: 'Serviço indisponível' }),
    );

    expect(error.kind).toBe('server');
    expect(error.message).toBe('O servidor encontrou um erro ao processar a solicitação.');
  });

  it('mapeia falha de rede (status 0) para network', () => {
    const error = toApiError(httpError(0, null));

    expect(error.kind).toBe('network');
    expect(error.message).toBe(
      'Não foi possível conectar à API. Verifique se o backend está em execução.',
    );
  });

  it('mapeia TimeoutError para timeout', () => {
    const error = toApiError(new TimeoutError());

    expect(error.kind).toBe('timeout');
    expect(error.message).toBe('A requisição demorou demais para responder.');
  });

  it('mantém instâncias de ApiError sem reembrulhar', () => {
    const original = new ApiError('Falha conhecida.', 'conflict', 409);

    expect(toApiError(original)).toBe(original);
  });
});
