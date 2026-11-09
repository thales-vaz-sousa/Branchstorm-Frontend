# Branchstorm UI — Guia de Design

Design system do frontend Angular (BranchstormUI). Este documento é a
referência rápida visual do projeto: cores, tipografia, espaçamento, bordas,
componentes, padrões de layout e motion. A fonte da verdade em código são os
tokens em `src/styles/_tokens.scss`.

## Identidade

- **Produto:** árvore de ideias (brainstorm que se ramifica).
- **Cor primária:** teal (`#1a8796` claro / `#4db6c4` escuro) — território Branchstorm.
- **Marcas:** folhinha verde/branca sem fundo (`public/brand/leaf-green.png`,
  `leaf-white.png`), `wide.png` (banner), Capybara no rodapé.
- **Pressupostos:** sem Material, sem Tailwind, sem sombras em cartões,
  sem gradientes, sem emojis, sem textos de template.

## Cores (tokens)

| Token        | Claro    | Escuro   | Uso                                      |
| ------------ | -------- | -------- | ---------------------------------------- |
| `--bg`       | `#f6fafa` | `#0a1719` | Fundo geral                              |
| `--card`     | `#ffffff` | `#102226` | Cartões, painéis, menus                  |
| `--ink`      | `#0e2a30` | `#e8f2f3` | Texto principal                          |
| `--muted`    | `#4b6168` | `#9db3b7` | Texto secundário, metadados              |
| `--teal`     | `#1a8796` | `#4db6c4` | Destaques, links, foco, seleção          |
| `--tink`     | `#126b77` | `#7acbd6` | Títulos de seção, etiquetas              |
| `--soft`     | `#e4f1f3` | `#14313a` | Fundos suaves, seleção                   |
| `--line`     | `#d5e4e7` | `#1e3a40` | Bordas 1px, conectores da árvore         |
| `--danger`   | `#b42318` | `#f2877d` | Erros, refutado                          |
| `--on-solid` | `#ffffff` | `#0a1719` | Texto sobre botões cheios / teal         |
| `--overlay`  | `rgba(14,42,48,.46)` | `rgba(0,0,0,.62)` | Scrim de drawer/bottom sheet  |
| `--dialog-shadow` | `0 24px 64px rgba(9,34,39,.18)` | `0 24px 64px rgba(0,0,0,.48)` | Só diálogos modais |

Tema: claro/escuro com `data-theme` no `<html>`, respeitando o sistema
(`prefers-color-scheme`). `dark` adapta os mesmos tokens, nunca cores novas.

## Tipografia

- **Títulos de página (h1/h2):** Cormorant Garamond 600 (única serifa).
- **Todo o resto:** DM Sans (400/500/700), base 15px, entrelinha 1.5.
- Escala: `xs .75rem · sm .8125 · base .9375 · lg 1.0625 · xl 1.25 · 2xl 1.5 · 3xl 2 · 4xl 2.5`.
- **Rótulos de seção:** 12px, caixa alta, `letter-spacing .16em`, cor `tink`, peso 500.
- Texto em PT-BR direto, verbo no imperativo ("Propor solução").

## Espaçamento e raios

- Espaçamento em múltiplos de **4px** (`--space-1..16`): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Raios: **cards 8px** (`--radius-card`), **controles 8px** (`--radius-control`),
  **pílulas 99px** (`--radius-pill`). Tokens abaixo do raio do card são a estética atual.
- Bordas: **1px** `--line` em cards/menus/inputs ( exceção: dialogos com border + sombra sutil).
- Shell: largura máxima `1280px`, respiro `24px`. Mapa ignorar o contêiner (fullscreen).

## Motion

- Durações: **120ms** rápida, **180ms** base; easing `cubic-bezier(.22,1,.36,1)`.
- Tudo respeita `prefers-reduced-motion` (reset global em `_base.scss`).
- Animações do produto: drawer/bottom-sheet (translate + fade), toolbar/menu
  (CDK), loader da marca (orbital + respiração), minimapa/zoom/pan do mapa.

## Componentes (`shared/ui/`)

- **Button** (filled = `tink`/`teal` + `on-solid`, outline, text). Altura 40 (sm 32).
- **Pill** (status/validação/papel), **Field** (label+erro+hint), **Dialog**
  (bottom sheet, CDK + `DialogShell`), **Menu** (CDK, sem sombra), **Tabs**,
  **Tooltip**, **Banner** (info/demo/error), **EmptyState**, **Spinner**,
  **Card**, **BrandLoader** (SVG orbital da marca, claro/escuro), **RatingStars**,
  **Role/Status/Validation badges** (traduzidos via i18n).
- Foco sempre visível: anel 2px `teal` com offset 2px.

## Pílulas de status ( iguais às do produto )

| Estado              | Rótulo PT        | Estilo                                  |
| ------------------- | ---------------- | --------------------------------------- |
| `open`              | Aberta           | contorno `teal`, fundo transparente     |
| `selected`          | Selecionada       | fundo `soft`, texto `tink`              |
| `discarded`         | Descartada       | contorno `line`, texto `muted`, riscado |
| `final`             | Final            | preenchido `tink`/`teal`, texto on-solid|
| `notTested`         | Não testada      | contorno `line`, texto `muted`          |
| `validated`         | Validada         | fundo `soft`, texto `tink`              |
| `refuted`           | Refutada         | contorno `danger`, texto `danger`       |

Tipos de nó: Problema / Solução / Ramo · Papéis: Administrador, Proprietário,
Colaborador, Avaliador.

## Padrões de layout

### Tela de mapa (árvore — centro do app)
- Mapa imersivo full-bleed (fora do contêiner de 1280px) com toolbar flutuante
  no topo-centro: seletor de layout (Paisagem/Retrato), configurações, home,
  fullscreen, centro, zoom `− % +`; detalhes da árvore no canto superior esquerdo.
- Cards de nó 250×112, links ortogonais, seta circular de abrir/fechar ramos no
  meio do vão; ghost card `+ Propor solução/ramo`; drawer direita (desktop) /
  bottom sheet (mobile) com abas Detalhes·Histórico·Hipóteses·Feedback.
- Minimapa (só telas pequenas) com viewport arrastável e clique-para-centrar.

### Formulários e diálogos
- Formulários como **bottom sheets** (sobem de baixo), fundo escuro atrás
  (`--overlay`), fechar com X/Esc/backdrop, foco preso no CDK.
- Validação inline por campo (Field com `error`), mutações sem optimistic update
  (o servidor manda o estado).

### Telas de lista (Equipes / Equipe)
- Cabeçalho: eyebrow + título serifado + ações à direita (gap 12px);
- Cards de equipe: avatar quadrado 8px + nome + membros + seta (sem chips de membros);
- Seções com títulos estilo eyebrow e separação com borda `--line`.

### Login
- Painel da marca à esquerda (banner `wide.png` arredondado), formulário à direita;
- Eyebrow "Identificação", pessoas como radio-cards.

### Sobre o Projeto (`#/sobre`)
- Tronco + ramos alternados (desktop centro / mobile esquerda), reveal no scroll,
  roadmap SVG, banner full-bleed no topo.

## Feedback visual do estado

- **Loading:** `app-brand-loader` (página completa) / `app-spinner` (inline) + barra de
  progresso fina no topo do shell + skeleton reservado apenas onde faz sentido.
- **Vazio:** `EmptyState` com ícone inline, título e CTA único.
- **Erro:** `Banner` (erro/demo/info) com ação "Tentar de novo".
- **Sucesso:** toast (`ToastStack`) com a confirmação.

## Integrações que afetam o desenho

- **PWA:** manifest, service worker e ícones — o app é instalável, offline-first
  leve; ícones da marca em `public/brand/`.
- **i18n runtime:** dicionários PT/EN/ES/FR (`core/i18n`), seletor no topo ao lado
  do usuário; `document.lang` e título da aba traduzidos. Todo texto visível usa
  chaves (`{{ 'chave' | translate }}`) — dados de usuário **não** são traduzidos.
- **Hash routing** (`withHashLocation`): recarregar qualquer rota nunca quebra;
  o renderização do site serve `/index.html` para `/*`.

## Do / Don'ts rápidos

- ✅ Usar tokens; ❌ cor/fonte/raio fora deles.
- ✅ Interações em 180ms com easing; ❌ libs de animação novas sem combinar.
- ✅ Adaptar claro/escuro via tokens; ❌ cores hardcoded de tema.
- ✅ Reutilizar componentes do kit; ❌ duplicar padrão visual nas telas.
