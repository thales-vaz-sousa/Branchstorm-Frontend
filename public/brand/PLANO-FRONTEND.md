# Branchstorm UI: plano e regras para a IA

Leia este arquivo inteiro antes de escrever código. Ele manda sobre qualquer preferência sua. Se algo estiver ambíguo ou faltar no contrato da API, **pergunte** em vez de inventar. Trabalhe em tarefas pequenas, mostre o diff e espere aprovação antes de seguir para a próxima fase.

## 1. Produto em 3 linhas

Branchstorm é uma plataforma colaborativa em que cada problema vira a raiz de uma árvore. A equipe propõe soluções e versões (ramos), comenta, testa hipóteses e seleciona o caminho até uma solução final. Nada é apagado: o que é descartado continua na árvore, com histórico e motivo. O front é a vitrine de um back-end em microsserviços (.NET) e fala **só com o gateway**.

## 2. Stack (decisões fechadas)

- **Angular** standalone, signals, zoneless, TypeScript `strict`. Roteamento **por hash** (`withHashLocation`).
- **Sem Angular Material.** Remova aos poucos: reimplemente cada peça atrás da fachada que já existe em `shared/ui/` e, no fim, desinstale `@angular/material`. Os componentes são **próprios**, em SCSS, usando **`@angular/cdk`** só para comportamento (dialog, overlay, menu, listbox, focus trap, a11y).
- Bibliotecas permitidas: `@angular/cdk`, `rxjs`, `d3-hierarchy`, `d3-shape` (curvas dos links), `d3-zoom` (pan e zoom da árvore). **Proibido** sem aprovação: Tailwind, Bootstrap, PrimeNG, shadcn/Spartan, bibliotecas de animação, de ícones ou de gráficos.
- Ícones: um conjunto pequeno de SVG inline próprio (chevron, plus, x, check, arrow, history, flask, message), traço 1.75, pontas redondas, `currentColor`.
- Testes: Vitest. Lint: ESLint + Prettier.
- Fora do caminho crítico: Docusaurus. Não gaste tempo nele agora.

## 3. Design: tokens (únicos valores permitidos)

Variáveis CSS em `:root`. Escuro em `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){...}}` e em `:root[data-theme="dark"]{...}`.

| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `#F6FAFA` | `#0A1719` |
| `--card` | `#FFFFFF` | `#102226` |
| `--ink` | `#0E2A30` | `#E8F2F3` |
| `--muted` | `#4B6168` | `#9DB3B7` |
| `--teal` | `#1A8796` | `#4DB6C4` |
| `--tink` | `#126B77` | `#7ACBD6` |
| `--soft` | `#E4F1F3` | `#14313A` |
| `--line` | `#D5E4E7` | `#1E3A40` |
| `--danger` | `#B42318` | `#F2877D` |
| `--on-solid` (texto sobre botão cheio) | `#FFFFFF` | `#0A1719` |

- Botão cheio: fundo `--tink` (claro) ou `--teal` (escuro), texto `--on-solid`. **Nunca** texto branco sobre `#1A8796` (contraste insuficiente).
- Tipografia: **Cormorant Garamond 600** só em títulos de página (h1/h2). Todo o resto em **DM Sans** (400, 500, 700). Base 15px, entrelinha 1.5. Rótulos de seção: 12px, caixa alta, `letter-spacing:.16em`, cor `--tink`, peso 500.
- Raios: cartões 14px, botões e campos 10px, pílulas 99px. Bordas de 1px `--line`. Espaçamento em múltiplos de 4px.
- **Sem** gradientes, vidro/blur, sombras em cartões (só overlay de dialog, bem sutil), emojis, ícones dentro de quadradinhos arredondados, "oops", textos genéricos. Texto em PT-BR direto, verbo no imperativo ("Propor solução").
- Movimento mínimo (transições de 120 a 200ms), respeitando `prefers-reduced-motion`.
- Marca: banner largo e ícone vêm de `assets/brand/` (copie de `1_-_wide.png` e `Icon.png`). Favicon: o ícone.

### Pílulas de status (iguais às da landing)

| Valor | Rótulo | Estilo |
|---|---|---|
| `open` | Aberta | contorno `--teal`, fundo transparente |
| `selected` | Selecionada | fundo `--soft`, texto `--tink` |
| `discarded` | Descartada | contorno `--line`, texto `--muted`, título riscado |
| `final` | Final | fundo cheio (`--tink` / `--teal`), texto `--on-solid` |
| validação `not_tested` | Não testada | contorno `--line`, texto `--muted` |
| validação validada | Validada | fundo `--soft`, texto `--tink` |
| validação `refuted` | Refutada | contorno `--danger`, texto `--danger` |

## 4. Componentes próprios (`shared/ui/`)

Button (cheio, contorno, texto; estados hover, foco, desabilitado, carregando), Pill, Card, Field (label + input/textarea/select + erro), Dialog (CDK), ConfirmDialog, Menu (CDK), Tabs, Tooltip, Banner (aviso/erro/demo), EmptyState, Spinner simples, TreeNode, NodePanel. Foco visível sempre (anel de 2px `--teal` com offset de 2px). Cada componente tem uma página de demonstração em `#/ui` (claro e escuro).

## 5. Telas e rotas (hash)

| Rota | Tela | O que faz |
|---|---|---|
| `#/entrar` | Identificação | Criar usuário ou escolher quem você é. **Sem login no MVP**: o `userCode` fica no `localStorage` (não é seguro, e isso é aceito) |
| `#/equipes` | Equipes | Minhas equipes e criar equipe |
| `#/equipes/:teamCode` | Equipe | Membros, papéis, adicionar e remover; lista de problemas da equipe e "Novo problema" |
| `#/ideias/:rootCode` | **Árvore** (principal) | A árvore, e o painel do nó selecionado (`?no=:code`) |

A tela da árvore é 80% do valor. As outras podem ser simples e consistentes.

### Árvore (especificação)

- Layout horizontal (raiz à esquerda) com `d3-hierarchy` (`tree().nodeSize(...)`). Nós em **HTML sobre SVG**: links como curvas suaves em `--line` (2px); o **caminho selecionado** da raiz até o nó ativo em `--teal`.
- Cartão do nó: pílula de status, título (máx. 2 linhas), tipo (Problema, Solução, Versão). Nó descartado: borda tracejada, texto `--muted`, título riscado. Nó ativo: anel `--teal`.
- Pan e zoom (`d3-zoom`), botão "Centralizar". Recolher e expandir descendentes.
- Teclado: ← pai, → primeiro filho, ↑↓ irmãos, Enter abre o painel, Esc fecha.
- Painel do nó (lateral no desktop, gaveta no celular), abas **Detalhes · Histórico · Hipóteses · Feedback**. Ações no topo: Propor solução ou versão, Selecionar, Marcar como final.

### Regras de negócio na interface

- Selecionar descarta os irmãos (e descendentes). **Sempre confirmar**: "Isso vai descartar N soluções. O histórico é mantido."
- Só um filho selecionado por nível. Só um nó selecionado pode virar final.
- Feedback só em nó com status `open`. Fora disso, o botão fica desabilitado **com a razão visível**.
- Nunca apagar nó: não existe botão de excluir.

## 6. Contrato da API (base única: o gateway)

Base URL em `environment` (sem URL fixa no código). Os `code` são GUIDs em maiúsculas: use exatamente como a API devolve (a comparação é sensível a caixa).

| Chamada | Uso |
|---|---|
| `POST /api/user` | criar usuário (`name`, `email`) |
| `GET /api/user` | listar (filtros `code`, `name`, `email`) |
| `GET /api/user?codes=A&codes=B` | **lote** (chave repetida, máx. **100** códigos) |
| `GET /api/user/{code}` | um usuário (404 se não existir) |
| `POST /api/team` · `GET /api/team/{code}` · `PATCH /api/team/{code}` | equipe, membros e papéis |
| `POST /api/idea` | cria nó (`FatherCode` vazio = problema raiz) |
| `GET /api/idea/{code}` · `GET /api/idea/tree/{code}` | nó e árvore |
| `PUT /api/idea/select/{code}` | seleciona (descarta irmãos) |
| `PUT /api/idea/validation/{code}` | uso interno (Hipóteses → Ideias), **a UI não chama** |
| `POST /api/hypothesis` · `GET /api/hypothesis?linkCode=` · `PUT /api/hypothesis/result/{code}` | hipóteses |
| `POST /api/feedbacks` · `GET /api/feedbacks?linkCode=` | feedback e nota |

Enums: `Type` = problem, solution, version. `Status` = open, selected, discarded, final. `Validation` = not_tested, validate (confirmar se o back-end usa `validated`), refuted. `Role` = Admin, Owner, Collaborator, Evaluator. **Centralize todos em um único arquivo de modelos.** Se divergirem do back-end, o back-end manda.

**Lacunas conhecidas (combinar com o back-end; até lá, isole em `data-access` e mocke):**
1. Listar equipes de um usuário (`GET /api/team?userCode=`).
2. Listar problemas raiz de uma equipe (`GET /api/idea?teamCode=&type=problem`).
3. Histórico de um nó (dentro de `GET /api/idea/{code}` ou endpoint próprio).
4. Marcar solução final (só existe `select`).

Erros vêm como `application/problem+json` (campos `status`, `title`, `detail`, `traceId`, e `errors` em validação). Converta tudo em um único `ApiError`.

## 7. Comportamento que gera confiança

- **Toda tela** tem estado de carregando, vazio e erro, com mensagem útil e botão "Tentar de novo".
- **Cold start (Render):** os serviços dormem e a primeira chamada pode passar de 1 minuto. Após 4s de espera, mostre um banner não bloqueante: "Acordando os serviços. Pode levar até 1 minuto." Timeout de 90s. Retry com recuo **só em GET** (nunca em POST/PUT).
- Mapeamento de erros: 400 mostra as mensagens por campo; 404 "não encontrado"; 409 "já existe"; 5xx ou rede "não foi possível falar com o servidor".
- Mutações: botão desabilitado e com "carregando" enquanto pendente; **sem atualização otimista** em selecionar/descartar (o servidor é a fonte da verdade): ao concluir, refaça o GET da árvore.
- **Modo demonstração** (mocks): faixa fixa "Modo demonstração: dados fictícios" sempre visível quando ligado. O build de produção usa a API real. Flags **por serviço** (`bs.mock.users`, `bs.mock.teams`, `bs.mock.ideas`, `bs.mock.hypotheses`, `bs.mock.feedback`) para integrar um serviço de cada vez. Os mocks devem seguir exatamente o contrato acima.
- Sem números, depoimentos ou métricas inventados. Sem texto de template.
- Acessibilidade: contraste AA, foco visível, tudo operável por teclado, rótulos em todos os campos.

## 8. Plano em fases (hoje é 8/11; entrega em 27/11)

O front **não é avaliado** pelo enunciado (só o back-end). Ele nunca pode atrasar as 3 integrações entre serviços.

**Fase 0 (até 11/11): fundação.** Remover Material atrás da fachada, tokens e fontes, shell (cabeçalho, rotas hash), componentes base e `#/ui`, `ApiClient` + `ApiError` + interceptor de erros, faixa de modo demonstração, flags de mock por serviço. *Pronto quando:* `#/ui` mostra todos os componentes em claro e escuro e `npm run build` passa sem `@angular/material`.

**Fase 1 (até 14/11): árvore em mock.** Layout d3, nós, links, painel, selecionar e descartar com confirmação, teclado. *Pronto quando:* os testes da lógica passam (abaixo) e dá para navegar e selecionar sem back-end.

**Fase 2 (11 a 18/11): back-end real, um serviço por vez.** Identificação e Usuários, depois Equipes, depois Ideias, desligando o mock de cada um conforme o serviço fica pronto. *Pronto quando:* o fluxo "criar usuário → criar equipe → criar problema → propor solução → selecionar" funciona de ponta a ponta.

**Fase 3 (18 a 25/11): Hipóteses e Feedback no painel, erros e cold start, acessibilidade, deploy.**

**Fase 4 (25 a 27/11): congelar, ensaiar a demonstração.** Só correções.

## 9. Deploy

GitHub Pages, no mesmo site da landing: o app fica em `/app/` (`ng build --base-href /app/`), com roteamento por hash para não dar 404 ao recarregar. Domínio `www.branchstorm.tech`. O gateway precisa liberar CORS para `https://www.branchstorm.tech` e `https://branchstorm.tech`. API em HTTPS (Render).

## 10. Testes obrigatórios (Vitest)

- Selecionar descarta todos os irmãos e seus descendentes; só um filho selecionado por pai.
- Só um nó selecionado pode virar final.
- Feedback bloqueado quando o status não é `open`.
- Construção da hierarquia a partir da lista plana (`FatherCode`), incluindo raiz única e ramos descartados.
- Mapeamento de `problem+json` para `ApiError`.
- Lote de usuários: no máximo 100 códigos por chamada (dividir em partes se passar).

## 11. Regras para a IA

1. Tarefas pequenas; uma fase por vez; mostre o diff.
2. Nenhuma dependência nova sem perguntar.
3. Nenhuma cor, fonte, raio ou espaçamento fora dos tokens.
4. Não invente endpoint, campo ou enum. Marque `// TODO(backend)` e pergunte.
5. Nunca desligue regras do TypeScript `strict` nem do ESLint para "fazer passar".
6. Código e identificadores em inglês; textos da interface em PT-BR.
7. Antes de dizer que terminou: `npm run build`, `npm test` e `npm run lint` passando.

## 12. Aceite final

- [ ] `@angular/material` removido; nenhuma classe `mat-` no HTML.
- [ ] Claro e escuro corretos; contraste AA.
- [ ] Todos os fluxos RF01 a RF11 passam pela interface contra o back-end real.
- [ ] Estados de carregando, vazio e erro em todas as telas; cold start tratado.
- [ ] Confirmação antes de descartar; histórico visível por nó.
- [ ] Faixa de modo demonstração correta; produção sem mocks.
- [ ] Deploy em `/app/` no domínio, sem 404 ao recarregar.
