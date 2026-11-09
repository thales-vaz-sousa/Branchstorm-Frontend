---
id: requisitos
title: Requisitos funcionais
sidebar_label: Requisitos RF01–RF11
slug: /requisitos
description: Cobertura funcional completa do Branchstorm, com regras de negócio e endpoints.
---

# Requisitos funcionais

Os onze requisitos funcionais definem o escopo do produto. Todos estão implementados no frontend e
cobertos pelo modo demonstração.

## RF01 — Pessoas

> Cadastrar, consultar e listar usuários.

- **Frontend:** página `/usuarios` com busca por nome ou e-mail, cadastro em diálogo e listagem em
  cartões.
- **API:** `POST /api/user`, `GET /api/user/{code}`, `GET /api/user`.
- **Modelo:** `CreateUserRequest { name, email }` → `UserResult { code, name, email }`.

## RF02 — Equipes e papéis

> Criar equipes e adicionar/remover membros com um papel (administrador, dono, colaborador,
> avaliador).

- **Frontend:** `/equipes` (lista e criação) e `/equipes/:code` (edição de nome, membros e papéis,
  com estado “sujo” e descarte de alterações).
- **API:** `POST /api/team`, `GET /api/team/{code}`, `PATCH /api/team/{code}`,
  `GET /api/team?userCode=...`.
- **Papéis:** `Administrador (0)`, `Dono (1)`, `Colaborador (2)`, `Avaliador (3)`.
- **Regra:** a equipe precisa de pelo menos um membro.

## RF03 — Problema raiz

> Cadastrar um problema/ideia raiz.

- **Frontend:** diálogo “Novo problema” a partir do painel ou da lista de ideias.
- **API:** `POST /api/idea` com `fatherCode: null` e `type: Problem (0)`.
- **Resultado:** o nó criado passa a ser a raiz de uma nova árvore e é aberto no workspace.

## RF04 — Soluções e versões

> Propor soluções e novas versões como filhos de um nó (link) da árvore, informando o motivo.

- **Frontend:** botão “Novo nó” no painel de detalhe e no cabeçalho do workspace.
- **Regra de tipo:** filho de `Problem` é `Solution (1)`; filho de `Solution` ou `Version` é
  `Version (2)`.
- **Motivo:** o campo `reason` é registrado no histórico do nó.
- **API:** `POST /api/idea` com `fatherCode` preenchido.

## RF05 — Seleção e solução final

> Selecionar um nó (os irmãos viram descartados) e marcar um nó como solução final.

- **Frontend:** ações “Selecionar” e “Final” no painel de detalhe, com diálogo de motivo.
- **Seleção:** o nó vira `Selected`; os irmãos viram `Discarded` — nunca são apagados.
- **Final:** só é permitido em nó `Selected`; passa a `Final`.
- **API:** `PUT /api/idea/select/{code}` e `PUT /api/idea/final/{code}`.
- **Regra:** apenas um filho por nível pode estar selecionado.

## RF06 — Árvore completa

> Consultar a árvore completa de uma ideia, incluindo nós descartados.

- **Frontend:** workspace `/ideias/:code` com canvas `d3-hierarchy`, zoom, recolher/expandir e
  alternância “Descartados”.
- **API:** `GET /api/idea/tree/{code}`.
- **Comportamento:** nós descartados ficam esmaecidos e tracejados; seus descendentes continuam
  visíveis quando a opção está ligada.

## RF07 — Hipóteses

> Cadastrar hipóteses em um nó (link), com critério de sucesso.

- **Frontend:** aba “Hipóteses” no painel de detalhe.
- **API:** `POST /api/hypothesis`.
- **Modelo:** `CreateHypothesisRequest { linkCode, description, successCriteria }`.

## RF08 — Resultado da hipótese

> Registrar o resultado de uma hipótese (validada ou refutada).

- **Frontend:** diálogo “Registrar resultado”, com opção validada/refutada e observação opcional.
- **API:** `PUT /api/hypothesis/result/{code}`.
- **Modelo:** `RegisterHypothesisResultRequest { result: Validated | Refuted, reason? }`.

## RF09 — Validação automática

> Atualizar automaticamente a validação do nó a partir do resultado da hipótese.

- **Integração:** o serviço de Hipóteses chama o serviço de Ideias ao registrar o resultado.
- **Frontend:** após registrar o resultado, a árvore é recarregada e o badge de validação do nó
  reflete `Validated` ou `Refuted`.
- **Fallback:** o painel também permite atualizar a validação manualmente, útil enquanto a
  integração não está disponível.

## RF10 — Feedback e nota

> Comentar e dar nota em um nó (link), apenas se ele estiver aberto a feedback.

- **Frontend:** aba “Feedback” com média, estrelas e diálogo de comentário/nota.
- **API:** `POST /api/feedbacks`.
- **Regra:** somente nós com status `Open` aceitam feedback; a interface desabilita o botão e
  explica o motivo nos demais status.

## RF11 — Listagem de feedbacks

> Listar os feedbacks de um nó (link).

- **Frontend:** lista com autor, nota, comentário e data relativa.
- **API:** `GET /api/feedbacks?linkCode=...`.

---

## Regras de negócio

1. Nós descartados **nunca são apagados**; apenas mudam de status.
2. Apenas **um filho por nível** pode estar selecionado.
3. Feedback só é aceito em nós com status **aberto**.
4. A solução final precisa ter sido **selecionada** antes.
5. Toda decisão (selecionar, finalizar, validar) registra **motivo, autor e data** no histórico.

## Matriz de cobertura

| Requisito | Página / componente                          | Endpoint principal                     |
| --------- | -------------------------------------------- | -------------------------------------- |
| RF01      | `/usuarios` · `UserFormDialog`               | `POST/GET /api/user`                   |
| RF02      | `/equipes` · `/equipes/:code`                | `POST/GET/PATCH /api/team`             |
| RF03      | `/ideias` · `LinkFormDialog`                 | `POST /api/idea`                       |
| RF04      | `/ideias/:code` · `LinkFormDialog`           | `POST /api/idea`                       |
| RF05      | `NodeDetailPanel` · `ReasonDialog`           | `PUT /api/idea/select/{code}` e `/final` |
| RF06      | `/ideias/:code` · `IdeaTreeCanvas`           | `GET /api/idea/tree/{code}`            |
| RF07      | `NodeDetailPanel` · `HypothesisFormDialog`   | `POST /api/hypothesis`                 |
| RF08      | `HypothesisResultDialog`                     | `PUT /api/hypothesis/result/{code}`    |
| RF09      | `NodeDetailPanel` · recarga da árvore        | `PUT /api/idea/validation/{code}`      |
| RF10      | `FeedbackFormDialog`                         | `POST /api/feedbacks`                  |
| RF11      | `NodeDetailPanel` · aba Feedback             | `GET /api/feedbacks?linkCode=...`      |
