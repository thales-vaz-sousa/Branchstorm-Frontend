---
id: frontend
title: Frontend em camadas
sidebar_label: Frontend em camadas
slug: /frontend
description: Como o Angular do Branchstorm replica Controller, Service e Repository do backend.
---

# Frontend em camadas

O frontend fica em `UI/BrainstormUI` e foi organizado para espelhar a separação de responsabilidades
dos microsserviços .NET. A ideia é simples: quem lê o backend entende o frontend, e vice-versa.

```text
Página / componente        ← Controller
        ↓
Store de feature (signals) ← Service
        ↓
*Api service               ← Repository
        ↓
ApiClient → HttpClient → gateway
```

## Mapa backend → frontend

| Backend (.NET)      | Frontend (Angular)                          | Exemplo                                  |
| ------------------- | ------------------------------------------- | ---------------------------------------- |
| Controller          | Página ou componente de feature             | `IdeaWorkspacePage`                      |
| Service             | Store com signals                           | `IdeaTreeStore`                          |
| Repository          | Serviço em `data-access/`                   | `IdeaApi`                                |
| DTO de entrada      | `*Request` em `shared/models`               | `CreateLinkRequest`                      |
| Result/DTO de saída | `*Result` em `shared/models`                | `LinkResult`                             |
| `Result<T>`         | `ApiError` + tratamento no store            | `toApiError(error)`                      |
| Entidade            | Não existe no frontend; só o contrato       | —                                        |

Nenhuma página chama `HttpClient` diretamente. O caminho é sempre
**página → store → api service → ApiClient**.

## Estrutura de pastas

```text
src/app
├── core
│   ├── api
│   │   ├── api-client.ts
│   │   ├── api-error.ts
│   │   └── interceptors/        # correlation id, auth, loading, erro
│   ├── auth                     # SessionStore + sessionGuard
│   ├── layout                   # AppShellComponent
│   ├── mock                     # backend simulado
│   ├── storage                  # RecentStore (localStorage)
│   └── ui                       # tema, notificações, loading
├── features
│   ├── auth/pages/login
│   ├── dashboard/pages/dashboard
│   ├── users                    # RF01
│   ├── teams                    # RF02
│   ├── ideas                    # RF03–RF06
│   ├── hypotheses               # RF07–RF09
│   └── feedbacks                # RF10–RF11
├── shared
│   ├── models                   # *Request / *Result / enums
│   ├── pipes
│   ├── ui                       # Material encapsulado + componentes reutilizáveis
│   └── utils
└── app.config.ts / app.routes.ts
```

Cada feature segue o mesmo desenho:

```text
features/ideas
├── data-access/idea-api.service.ts
├── pages/
│   ├── ideas/                   # lista de árvores
│   └── idea-workspace/          # árvore + painel de detalhe
├── state/
│   ├── idea-list.store.ts
│   └── idea-tree.store.ts
└── ui/
    ├── idea-tree-canvas/
    ├── link-form-dialog/
    ├── node-detail-panel/
    └── validation-dialog/
```

## Camada de dados

O `ApiClient` é o único ponto que conhece a URL base. Ele monta a URL a partir de
`environment.apiUrl` e converte objetos de query em `HttpParams`.

```ts
// src/app/core/api/api-client.ts
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }
  // put, patch, delete...
}
```

Os serviços de `data-access` só descrevem o contrato:

```ts
@Injectable({ providedIn: 'root' })
export class IdeaApi {
  private readonly api = inject(ApiClient);

  findTree(rootCode: string): Observable<LinkResult[]> {
    return this.api.get<LinkResult[]>(`/api/idea/tree/${rootCode}`);
  }

  create(request: CreateLinkRequest): Observable<LinkResult> {
    return this.api.post<LinkResult>('/api/idea', request);
  }

  select(code: string, request: SelectLinkRequest = {}): Observable<LinkResult> {
    return this.api.put<LinkResult>(`/api/idea/select/${code}`, request);
  }
}
```

## Stores com signals

Não há NgRx. Cada feature expõe um store `providedIn: 'root'` com estado privado em `signal` e
getters públicos `asReadonly()`.

```ts
@Injectable({ providedIn: 'root' })
export class IdeaTreeStore {
  private readonly api = inject(IdeaApi);

  private readonly _nodes = signal<readonly LinkResult[]>([]);
  private readonly _selectedCode = signal<string | null>(null);
  private readonly _loading = signal(false);

  readonly nodes = this._nodes.asReadonly();
  readonly selectedCode = this._selectedCode.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly selectedNode = computed(() => {
    const code = this._selectedCode();
    return code ? (this._nodes().find((node) => node.code === code) ?? null) : null;
  });

  async load(rootCode: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const nodes = await firstValueFrom(this.api.findTree(rootCode));
      this._nodes.set(nodes);
    } catch (error) {
      this._error.set(toApiError(error));
    } finally {
      this._loading.set(false);
    }
  }
}
```

Convenções adotadas:

- estado privado com prefixo `_`;
- leitura pública via `asReadonly()`;
- estado derivado via `computed()`, nunca duplicado em signals;
- operações assíncronas retornam `Promise` e tratam erro com `toApiError`;
- `_loading`/`_saving` controlam feedback visual;
- listas e mapas são tratados como imutáveis (`readonly`).

### Stores por feature

| Store                | Responsabilidade                                                    |
| -------------------- | ------------------------------------------------------------------- |
| `SessionStore`       | pessoa selecionada (MVP), iniciais e estado de autenticação          |
| `UserDirectoryStore` | cache de pessoas por código, usado por equipes e feedbacks           |
| `TeamsStore`         | equipes do usuário, equipe atual e visão com membros resolvidos      |
| `IdeaListStore`      | raízes de árvore por equipe                                          |
| `IdeaTreeStore`      | árvore completa, nó selecionado, recolhimento, filtro e estatísticas |
| `HypothesisStore`    | hipóteses indexadas por `linkCode`                                   |
| `FeedbackStore`      | feedbacks indexados por `linkCode` e média de notas                  |
| `RecentStore`        | equipes e ideias abertas recentemente (localStorage)                 |
| `LoadingStore`       | contador global de requisições em andamento                          |

## Páginas como controllers

As páginas são standalone, `OnPush` e usam `input()`/`output()` quando recebem dados por rota ou
por componente pai. Elas apenas:

1. disparam o carregamento no store;
2. expõem estado do store para o template;
3. abrem diálogos e traduzem eventos de UI em chamadas ao store.

```ts
@Component({
  selector: 'app-idea-workspace-page',
  imports: [...BS_MATERIAL, IdeaTreeCanvasComponent, NodeDetailPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './idea-workspace.page.html',
})
export class IdeaWorkspacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly tree = inject(IdeaTreeStore);
  protected readonly nodes = this.tree.visible;
  protected readonly selectedNode = this.tree.selectedNode;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code');
      if (code) {
        void this.tree.load(code);
      }
    });
  }
}
```

## Angular Material encapsulado

A regra é: **nenhuma feature importa `@angular/material/*` diretamente**. Todo o Material passa por
dois arquivos:

- `src/app/shared/ui/material.ts` — reexporta os módulos usados em `BS_MATERIAL`;
- `src/styles/_theme.scss` — traduz os tokens da marca para o tema Material.

```ts
// shared/ui/material.ts
export const BS_MATERIAL = [
  MatAutocompleteModule,
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatTabsModule,
  // ...
] as const;
```

```ts
// uso em uma feature
import { BS_MATERIAL } from '@shared/ui/material';

@Component({
  imports: [...BS_MATERIAL, StatusBadgeComponent],
})
export class NodeDetailPanelComponent {}
```

Trocar de biblioteca significa reescrever `material.ts`, `_theme.scss` e os componentes de
`shared/ui`. As páginas e os stores permanecem intactos.

Os diálogos também são encapsulados: `UiDialogService` é a fachada para `MatDialog`, e
`ConfirmDialogComponent` / `ReasonDialogComponent` são reutilizados por todas as features.

## Árvore de ideias com d3-hierarchy

O layout da árvore usa **apenas o cálculo** do `d3-hierarchy`. A renderização é SVG + HTML do
Angular, sem `d3-selection`:

```ts
const hierarchy = stratify<LinkResult>()
  .id((node) => node.code)
  .parentId((node) =>
    node.fatherCode && byCode.has(node.fatherCode) ? node.fatherCode : undefined,
  )([...visible]);

const layout = tree<LinkResult>().nodeSize([
  NODE_HEIGHT + SIBLING_GAP,
  NODE_WIDTH + LEVEL_GAP,
]);

const root = layout(hierarchy);
```

- `stratify` monta a hierarquia a partir de `code` / `fatherCode`;
- `tree().nodeSize(...)` posiciona os nós;
- o componente projeta `x`/`y` para o template;
- os links são desenhados como `<path>` SVG com curvas;
- os nós são cartões HTML posicionados por `transform`, com badges de status e validação;
- zoom e pan são aplicados no contêiner, com botões de ampliar/reduzir/ajustar.

Antes do layout, `buildVisibleTree` aplica as regras de visibilidade:

```ts
buildVisibleTree(nodes, {
  showDiscarded: this._showDiscarded(),
  collapsedCodes: this._collapsedCodes(),
});
```

- nós `Discarded` (e seus descendentes) somem quando “Descartados” está desligado;
- descendentes de nós recolhidos também somem;
- a árvore completa continua disponível na API — nada é apagado.

## Diálogos e fluxos

| Diálogo                      | Usado em            | Requisito |
| ---------------------------- | ------------------- | --------- |
| `LinkFormDialog`             | ideias              | RF03, RF04 |
| `ReasonDialog`               | selecionar/finalizar| RF05      |
| `ValidationDialog`           | validação manual    | RF09      |
| `HypothesisFormDialog`       | hipóteses           | RF07      |
| `HypothesisResultDialog`     | resultado           | RF08      |
| `FeedbackFormDialog`         | feedback e nota     | RF10      |
| `UserFormDialog`             | pessoas             | RF01      |
| `TeamFormDialog`             | equipes             | RF02      |
| `ConfirmDialogComponent`     | descartar alterações| —         |

Após uma ação que altera a árvore (selecionar, finalizar, validar ou registrar resultado), o
`NodeDetailPanelComponent` emite `treeChanged` e o workspace chama `IdeaTreeStore.refresh()`. Assim
o estado local nunca diverge do backend.

## Interceptors

Registrados em `app.config.ts`, na ordem em que executam:

| Interceptor                 | Papel                                                        |
| --------------------------- | ------------------------------------------------------------ |
| `correlationIdInterceptor`  | gera/propaga `X-Correlation-Id` para rastrear a requisição    |
| `authInterceptor`           | envia `X-User-Code` da sessão provisória                      |
| `loadingInterceptor`        | incrementa/decrementa o `LoadingStore`                        |
| `mockApiInterceptor`        | responde `/api/**` no modo demonstração                       |
| `errorInterceptor`          | normaliza erros HTTP em `ApiError` e notifica o usuário       |

O `errorInterceptor` fica por último para enxergar o resultado final dos anteriores.

## Tratamento de erros

`toApiError` converte `HttpErrorResponse`, `ProblemDetails` e falhas de rede em um tipo único:

```ts
export type ApiErrorKind =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'unauthorized'
  | 'server'
  | 'network'
  | 'unknown';
```

As páginas exibem o erro com `EmptyStateComponent` ou `NotificationService.error`, e os stores
mantêm o último erro em `error()` para estados de retry.

## Change detection zoneless

A aplicação usa `provideZonelessChangeDetection()`. Não há `zone.js`. Toda atualização de tela é
conduzida por signals, `input()`/`output()` e eventos do Angular.

Consequências práticas:

- não é necessário `ChangeDetectorRef.detectChanges()`;
- estado mutado fora de signals não dispara renderização;
- `OnPush` é o padrão em todos os componentes.

## Acessibilidade e idioma

- Interface em **pt-BR**, com datas formatadas por pipes próprios (`RelativeDatePipe`,
  `DateTimePipe`).
- Diálogos usam `autoFocus: 'first-tabbable'` e restauram o foco ao fechar.
- Botões de ícone têm `aria-label`; badges carregam texto, não apenas cor.
- Tokens de tema respeitam `prefers-color-scheme` e o `color-scheme` do documento.

## Identidade visual

Os tokens ficam em `src/styles/_tokens.scss` e o tema Material em `src/styles/_theme.scss`:

| Token               | Claro     | Escuro    |
| ------------------- | --------- | --------- |
| `--bs-brand`        | `#1a8796` | `#1a8796` |
| `--bs-brand-strong` | `#14707d` | `#14707d` |
| `--bs-canvas`       | `#f6f5f1` | `#0a1418` |
| `--bs-surface`      | `#ffffff` | `#102027` |
| `--bs-text`         | `#132a31` | `#e7f1f2` |

Tipografia: **Cormorant Garamond** para títulos e **DM Sans** para corpo. O `ThemeService` grava a
preferência em `localStorage` e aplica `data-theme` + `color-scheme` no elemento raiz.

## Testes e qualidade

- **Vitest** via `@angular/build:unit-test`, com `happy-dom`.
- **ESLint** flat config com `typescript-eslint`, `angular-eslint` e regras de templates.
- **Prettier** para TS, HTML, SCSS e JSON.

```bash
npm test
npm run lint
npm run format:check
```
