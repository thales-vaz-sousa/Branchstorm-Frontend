---
id: api
title: Contrato da API
sidebar_label: Contrato da API
slug: /api
description: Endpoints, modelos de request/response, enums e compatibilidade do Branchstorm.
---

# Contrato da API

O frontend fala com um único host: o **gateway**. Em desenvolvimento, `environment.apiUrl` é
vazio e o `proxy.conf.json` encaminha `/api/*` para os serviços locais. Em produção, a base é
`https://api.branchstorm.tech`.

```ts
// src/environments/environment.ts
export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://api.branchstorm.tech',
  docsUrl: 'https://docs.branchstorm.tech',
  useMocks: false,
};
```

## Convenções

| Item             | Convenção                                                             |
| ---------------- | --------------------------------------------------------------------- |
| Formato          | JSON (`application/json`)                                             |
| Códigos          | `string` opaca, gerada pelo backend                                   |
| Datas            | ISO 8601 em UTC                                                       |
| Autenticação     | provisória: cabeçalho `X-User-Code` com o código da pessoa            |
| Correlação       | cabeçalho `X-Correlation-Id`, gerado no frontend e ecoado pelo backend |
| Erros            | `ProblemDetails` (`title`, `status`, `detail`, `errors`)              |
| Paginação        | não implementada; as listas retornam todos os registros               |

Cabeçalhos enviados pelo frontend:

```http
X-User-Code: user-pedro
X-Correlation-Id: 6f1c2f1e-7d4a-4f4e-9a3e-2f0a1b7c9d11
```

## Enums

Os **requests** usam enums numéricos. Os **responses** usam nomes em PascalCase para `type`,
`validation` e `status`.

### `LinkType` (request)

| Valor | Nome       |
| ----- | ---------- |
| `0`   | `Problem`  |
| `1`   | `Solution` |
| `2`   | `Version`  |

### `LinkValidation` (request)

| Valor | Nome        |
| ----- | ----------- |
| `0`   | `NotTested` |
| `1`   | `Validated` |
| `2`   | `Refuted`   |

### `LinkStatus` (response, string)

`Open` · `Selected` · `Discarded` · `Final`

### `TeamMemberRole` (request)

| Valor | Nome           | Papel na interface |
| ----- | -------------- | ------------------ |
| `0`   | `Admin`        | Administrador      |
| `1`   | `Owner`        | Dono               |
| `2`   | `Collaborator` | Colaborador        |
| `3`   | `Evaluator`    | Avaliador          |

:::warning Assimetria proposital
Os enums de request são numéricos, mas `LinkResult.type`, `LinkResult.validation` e
`LinkResult.status` chegam como **strings** (`"Problem"`, `"Validated"`, `"Open"`). O mock e os
stores já normalizam isso; qualquer backend novo precisa manter o mesmo contrato.
:::

## Pessoas — RF01

### `GET /api/user`

Lista pessoas. Todos os filtros são opcionais e combináveis.

| Query   | Tipo       | Descrição                                  |
| ------- | ---------- | ------------------------------------------ |
| `codes` | repetível  | busca em lote por códigos                  |
| `code`  | `string`   | filtro exato por código                    |
| `name`  | `string`   | busca por nome                             |
| `email` | `string`   | busca por e-mail                           |

```http
GET /api/user?codes=user-pedro&codes=user-thales
```

**200** → `UserResult[]`

### `GET /api/user/{code}`

**200** → `UserResult` · **404** → `ProblemDetails`

### `POST /api/user`

```json
{
  "name": "Ana Souza",
  "email": "ana@branchstorm.tech"
}
```

**201** → `UserResult`

### Modelos

```ts
interface UserResult {
  readonly code: string;
  readonly name: string;
  readonly email: string;
}

interface CreateUserRequest {
  readonly name: string;
  readonly email: string;
}
```

## Equipes — RF02

### `GET /api/team`

| Query      | Tipo     | Descrição                         |
| ---------- | -------- | --------------------------------- |
| `userCode` | `string` | equipes das quais a pessoa faz parte |

**200** → `TeamResult[]`

### `GET /api/team/{code}`

**200** → `TeamResult` · **404** → `ProblemDetails`

### `POST /api/team`

```json
{
  "name": "Branchstorm",
  "members": [
    { "userCode": "user-pedro", "role": 1 },
    { "userCode": "user-ana", "role": 3 }
  ]
}
```

**201** → `TeamResult`

### `PATCH /api/team/{code}`

Atualiza nome e membros. O payload é o mesmo de criação.

```json
{
  "name": "Branchstorm Labs",
  "members": [
    { "userCode": "user-pedro", "role": 1 },
    { "userCode": "user-thales", "role": 2 }
  ]
}
```

**200** → `TeamResult`

### Modelos

```ts
interface TeamMember {
  readonly teamCode?: string | null;
  readonly userCode: string;
  readonly role: TeamMemberRole;
}

interface TeamResult {
  readonly code: string;
  readonly name: string;
  readonly members: readonly TeamMember[];
}

interface CreateTeamRequest {
  readonly name: string;
  readonly members: readonly TeamMember[];
}
```

## Ideias — RF03 a RF06

### `GET /api/idea`

Lista as raízes de árvore, opcionalmente filtradas por equipe.

| Query      | Tipo     | Descrição          |
| ---------- | -------- | ------------------ |
| `teamCode` | `string` | raízes de uma equipe |

**200** → `LinkResult[]`

### `GET /api/idea/{code}`

**200** → `LinkResult` · **404** → `ProblemDetails`

### `GET /api/idea/tree/{code}`

Retorna a **árvore completa** a partir da raiz informada, incluindo nós descartados.

**200** → `LinkResult[]` (lista plana; a hierarquia é montada por `fatherCode`)

### `POST /api/idea`

Cria um problema raiz (`fatherCode: null`) ou um filho.

```json
{
  "fatherCode": null,
  "type": 0,
  "title": "Reduzir o desperdício no refeitório",
  "description": "Estudantes deixam comida no prato...",
  "autorCode": "user-pedro",
  "teamCode": "team-branchstorm",
  "reason": "Dor observada em entrevistas."
}
```

Regras de tipo:

| Pai                | Tipo do filho |
| ------------------ | ------------- |
| —                  | `Problem (0)` |
| `Problem`          | `Solution (1)`|
| `Solution`/`Version` | `Version (2)` |

**201** → `LinkResult`

### `PUT /api/idea/select/{code}`

Seleciona o nó e descarta os irmãos.

```json
{ "reason": "Menor custo de implantação." }
```

**200** → `LinkResult`

### `PUT /api/idea/final/{code}`

Marca um nó **já selecionado** como solução final.

```json
{ "reason": "Hipótese validada e feedback positivo." }
```

**200** → `LinkResult` · **409** se o nó não estiver `Selected`

### `PUT /api/idea/validation/{code}`

Atualiza a validação do nó. Usado pela integração de Hipóteses (RF09) e pelo fallback manual.

```json
{
  "validation": 1,
  "reason": "Hipótese validada no teste com 40 estudantes."
}
```

**200** → `LinkResult`

### Modelos

```ts
interface LinkResult {
  readonly code: string;
  readonly fatherCode: string | null;
  readonly type: 'Problem' | 'Solution' | 'Version';
  readonly title: string;
  readonly description: string | null;
  readonly status: 'Open' | 'Selected' | 'Discarded' | 'Final';
  readonly validation: 'NotTested' | 'Validated' | 'Refuted';
  readonly autorCode: string | null;
  readonly teamCode: string | null;
  readonly reason: string | null;
  readonly creationDate: string;
  readonly history: readonly LinkHistoryResult[];
}

interface LinkHistoryResult {
  readonly code: string;
  readonly linkCode: string;
  readonly event: string;
  readonly creationDate: string;
}
```

## Hipóteses — RF07 a RF09

### `GET /api/hypothesis?linkCode={code}`

**200** → `HypothesisResult[]`

### `POST /api/hypothesis`

```json
{
  "linkCode": "link-reserva-1dia",
  "description": "Estudantes aceitam reservar com 1 dia de antecedência.",
  "successCriteria": "Mais de 70% das reservas concluídas até 18h."
}
```

**201** → `HypothesisResult`

### `PUT /api/hypothesis/result/{code}`

```json
{
  "result": "Validated",
  "reason": "72% das reservas concluídas no prazo."
}
```

**200** → `HypothesisResult`

Ao registrar o resultado, o serviço de Hipóteses chama
`PUT /api/idea/validation/{linkCode}` no serviço de Ideias. Essa é a integração do **RF09**.

### Modelos

```ts
interface HypothesisResult {
  readonly code: string;
  readonly linkCode: string;
  readonly description: string;
  readonly successCriteria: string;
  readonly result: 'Validated' | 'Refuted' | null;
  readonly creationDate: string;
}

interface CreateHypothesisRequest {
  readonly linkCode: string;
  readonly description: string;
  readonly successCriteria: string;
}

interface RegisterHypothesisResultRequest {
  readonly result: 'Validated' | 'Refuted';
  readonly reason?: string | null;
}
```

## Feedback — RF10 e RF11

### `GET /api/feedbacks?linkCode={code}`

**200** → `FeedbackResult[]`

### `POST /api/feedbacks`

Só é aceito quando o nó está com status `Open`.

```json
{
  "linkCode": "link-reserva-1dia",
  "autorCode": "user-ana",
  "test": "O fluxo é simples, mas o lembrete precisa ser mais visível.",
  "rating": 4
}
```

**201** → `FeedbackResult` · **409** se o nó não estiver aberto

### Modelos

```ts
interface FeedbackResult {
  readonly code: string;
  readonly linkCode: string;
  readonly autorCode: string;
  readonly test: string;
  readonly rating: number;
  readonly creationDate: string;
}

interface CreateFeedbackRequest {
  readonly linkCode: string;
  readonly autorCode: string;
  readonly test: string;
  readonly rating: number;
}
```

## Erros

O backend devolve `ProblemDetails`:

```json
{
  "title": "Nó não está aberto para feedback",
  "status": 409,
  "detail": "Somente nós com status Open aceitam feedback.",
  "errors": {}
}
```

O `errorInterceptor` converte a resposta em `ApiError`:

```ts
type ApiErrorKind =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'unauthorized'
  | 'server'
  | 'network'
  | 'unknown';
```

| HTTP | `kind`         | Tratamento na interface                              |
| ---- | -------------- | ---------------------------------------------------- |
| 400  | `validation`   | mensagens por campo no formulário                     |
| 401  | `unauthorized` | encerra a sessão e volta para `/entrar`               |
| 404  | `not-found`    | `EmptyStateComponent` com ação de retorno             |
| 409  | `conflict`     | notificação com o motivo retornado pelo backend       |
| 5xx  | `server`       | notificação genérica e opção de tentar novamente      |
| —    | `network`      | aviso de conexão e fallback para dados recentes       |

## Tabela-resumo

| Método | Rota                            | Requisito |
| ------ | ------------------------------- | --------- |
| GET    | `/api/user`                     | RF01      |
| GET    | `/api/user/{code}`              | RF01      |
| POST   | `/api/user`                     | RF01      |
| GET    | `/api/team`                     | RF02      |
| GET    | `/api/team/{code}`              | RF02      |
| POST   | `/api/team`                     | RF02      |
| PATCH  | `/api/team/{code}`              | RF02      |
| GET    | `/api/idea`                     | RF03, RF06 |
| GET    | `/api/idea/{code}`              | RF06      |
| GET    | `/api/idea/tree/{code}`         | RF06      |
| POST   | `/api/idea`                     | RF03, RF04 |
| PUT    | `/api/idea/select/{code}`       | RF05      |
| PUT    | `/api/idea/final/{code}`        | RF05      |
| PUT    | `/api/idea/validation/{code}`   | RF09      |
| GET    | `/api/hypothesis`               | RF07      |
| POST   | `/api/hypothesis`               | RF07      |
| PUT    | `/api/hypothesis/result/{code}` | RF08, RF09 |
| GET    | `/api/feedbacks`                | RF11      |
| POST   | `/api/feedbacks`                | RF10      |

## Notas de compatibilidade

- **Enums assimétricos.** Requests numéricos, responses em string. Não envie `"Problem"` no
  `type` do `POST /api/idea`; envie `0`.
- **`LinkResult.history`** vem embutido no nó. O frontend não faz uma chamada separada para o
  histórico.
- **`LinkResult.type`** usa PascalCase (`"Problem"`), enquanto `LinkType` no request é numérico.
- **Equipes** são atualizadas com `PATCH`, não `PUT`.
- **Rotas de ação** usam o verbo antes do código: `/select/{code}`, `/validation/{code}`,
  `/final/{code}` e `/result/{code}`.
- **Listagem de ideias por equipe** usa `GET /api/idea?teamCode=...`; o backend ainda precisa
  implementar esse filtro.
- **Marcar como final** ainda não existe no `IdeaServiceApi` atual; o frontend e o mock já seguem o
  contrato acima.
