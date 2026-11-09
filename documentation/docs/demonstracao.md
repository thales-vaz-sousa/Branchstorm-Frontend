---
id: demonstracao
title: Modo demonstração
sidebar_label: Modo demonstração
slug: /demonstracao
description: Navegue por todos os fluxos do Branchstorm sem backend, com dados semeados no navegador.
---

# Modo demonstração

O ambiente de desenvolvimento sobe com um **backend simulado no navegador**. Um
`HttpInterceptor` responde todas as chamadas para `/api/**`, com latência artificial de 220 ms e
dados persistidos no `localStorage`.

Isso permite demonstrar RF01–RF11 sem subir nenhum serviço .NET.

## Como funciona

```text
Componente → Store → Api service → ApiClient
                                      │
                                      ▼
                              HttpClient
                                      │
                          mockApiInterceptor
                                      │
                         mock-db (localStorage)
```

- `mock-mode.ts` decide se o modo está ativo;
- `mock-api.interceptor.ts` implementa as rotas, validações e códigos HTTP;
- `mock-db.ts` contém os dados semeados e os mapeadores de enum.

O modo só é ativado quando **as duas condições** são verdadeiras:

```ts
environment.useMocks === true &&
  localStorage.getItem('bs.useMocks') !== 'false';
```

Em produção (`environment.useMocks: false`), o interceptor nunca interfere.

## Ligar, desligar e restaurar

| Ação                   | Como fazer                                                    |
| ---------------------- | ------------------------------------------------------------- |
| Desligar o modo        | `localStorage.setItem('bs.useMocks', 'false'); location.reload()` |
| Religar o modo         | `localStorage.setItem('bs.useMocks', 'true'); location.reload()`  |
| Restaurar os dados     | `localStorage.removeItem('bs.mock.db.v1'); location.reload()`     |
| Apagar a sessão        | `localStorage.removeItem('bs.session.user'); location.reload()`   |

Chaves usadas pelo frontend:

| Chave               | Conteúdo                                        |
| ------------------- | ----------------------------------------------- |
| `bs.useMocks`       | `'true'` / `'false'`                            |
| `bs.mock.db.v1`     | banco simulado (pessoas, equipes, nós, etc.)    |
| `bs.session.user`   | pessoa selecionada no login provisório          |
| `bs.theme`          | preferência de tema (`light`/`dark`/`system`)   |
| `bs.recent.teams`   | equipes abertas recentemente                    |
| `bs.recent.ideas`   | ideias abertas recentemente                     |

## Dados semeados

### Pessoas

| Código          | Nome             | E-mail                     |
| --------------- | ---------------- | -------------------------- |
| `user-pedro`    | Pedro Pavei      | `pedro@branchstorm.tech`   |
| `user-matheus`  | Matheus Cechinel | `matheus@branchstorm.tech` |
| `user-thales`   | Thales Vaz       | `thales@branchstorm.tech`  |
| `user-ana`      | Ana Souza        | `ana@branchstorm.tech`     |

### Equipes

| Código             | Nome               | Membros e papéis                                              |
| ------------------ | ------------------ | ------------------------------------------------------------- |
| `team-branchstorm` | Branchstorm        | Pedro (Admin), Matheus (Owner), Thales (Collaborator), Ana (Evaluator) |
| `team-satc`        | SATC Inovação      | Ana (Owner), Pedro (Collaborator)                             |

### Ideias

**Árvore 1 — Reduzir o desperdício no refeitório**

```text
Problema: Reduzir o desperdício no refeitório          (Open)
├── Aplicativo de reserva de refeições                 (Selected)
│   ├── Reserva com 1 dia de antecedência              (Selected, Validated)
│   │   └── Solução final: reserva + lembrete          (Final, Validated)
│   └── Reserva com 2 dias de antecedência             (Discarded, Refuted)
├── Servir porções menores                             (Discarded, Refuted)
└── Doação das sobras                                  (Discarded, NotTested)
```

**Árvore 2 — Mapear temas de inovação para o TCC**

```text
Problema: Mapear temas de inovação para o TCC           (Open)
├── Assistente de temas com IA                         (Open)
└── Workshop de descoberta de temas                    (Open)
```

### Hipóteses e feedback

| Item                | Conteúdo                                                             |
| ------------------- | -------------------------------------------------------------------- |
| Hipótese validada   | “Reservas com 1 dia reduzem as sobras em pelo menos 30%.”            |
| Hipótese refutada   | “Reservas com 2 dias reduzem as sobras sem perder adesão.”           |
| Hipótese em aberto  | “Um assistente de IA aumenta a quantidade de temas relevantes.”      |
| Feedbacks           | Notas 5 e 4 no problema do refeitório; nota 4 no assistente de IA    |

## Roteiro sugerido de demonstração

1. **Entrar** em `/entrar` e escolher uma pessoa — a sessão fica salva.
2. **Painel** `/painel`: visão geral, equipes e ideias recentes.
3. **Pessoas** `/usuarios`: buscar, cadastrar e listar (RF01).
4. **Equipes** `/equipes`: criar uma equipe; abrir `/equipes/team-branchstorm` e alterar papéis
   (RF02). O botão de salvar só habilita quando há mudanças.
5. **Ideias** `/ideias`: criar um problema raiz (RF03) e abrir a árvore.
6. **Workspace** `/ideias/link-refeitorio`:
   - navegar, dar zoom, recolher e alternar “Descartados” (RF06);
   - criar uma solução/versão com motivo (RF04);
   - selecionar um nó e observar os irmãos virarem descartados (RF05);
   - marcar o nó selecionado como final (RF05);
   - criar uma hipótese (RF07), registrar resultado (RF08) e ver a validação mudar (RF09);
   - comentar e avaliar um nó aberto (RF10) e listar os feedbacks (RF11).
7. **Tema**: alternar claro/escuro pelo menu do cabeçalho.

## O que o mock valida

O interceptor não é um “retorno fixo”: ele aplica as regras principais.

- **Tipo do filho** derivado do pai (`Problem → Solution`, `Solution/Version → Version`).
- **Seleção** marca o nó como `Selected` e os irmãos como `Discarded`.
- **Final** só é aceito em nó `Selected`; caso contrário responde `409`.
- **Feedback** só é aceito em nó `Open`; caso contrário responde `409`.
- **Hipótese validada/refutada** atualiza a validação do nó e grava histórico.
- **Histórico** recebe um evento a cada decisão, com motivo, autor e data.
- **404/405** são retornados para rotas e métodos não suportados.

## Limitações

O modo demonstração é uma ferramenta de desenvolvimento e apresentação, não uma implementação do
backend.

- Os dados vivem no `localStorage` do navegador — não são compartilhados entre pessoas.
- Não há autenticação real: qualquer pessoa pode escolher um usuário.
- Não há concorrência, transações nem controle de acesso por papel.
- As integrações entre serviços são simuladas dentro do próprio interceptor.
- Limpar os dados do navegador apaga o banco simulado.

Para o comportamento real, consulte [Contrato da API](./api.md) e
[Como executar](./execucao.md).

## Depurando

```js
// inspecionar o banco simulado
JSON.parse(localStorage.getItem('bs.mock.db.v1'));

// ver a versão atual da sessão
JSON.parse(localStorage.getItem('bs.session.user'));

// forçar recarga limpa
localStorage.removeItem('bs.mock.db.v1');
localStorage.removeItem('bs.session.user');
location.reload();
```

As requisições continuam passando pelo `HttpClient`, então o painel **Network** do navegador
mostra as chamadas e o cabeçalho `X-Correlation-Id` — útil para explicar o fluxo em uma
apresentação.
