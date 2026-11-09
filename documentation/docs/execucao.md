---
id: execucao
title: Como executar
sidebar_label: Como executar
slug: /execucao
description: Suba o frontend em modo demonstração ou conecte aos microsserviços reais.
---

# Como executar

O projeto tem duas partes independentes:

- `UI/BrainstormUI` — frontend Angular;
- `UserServiceApi`, `TeamServiceApi`, `IdeaServiceApi`, `HypothesisServiceApi`, `FeedbackApi` e
  `BranchstormApi` (gateway) — backend .NET.

## Pré-requisitos

| Ferramenta | Versão mínima |
| ---------- | ------------- |
| Node.js    | 20            |
| npm        | 10            |
| .NET SDK   | 8             |

## Frontend

```bash
cd UI/BrainstormUI
npm install
npm start
```

A aplicação abre em [http://localhost:4200](http://localhost:4200).

### Modo demonstração (padrão em desenvolvimento)

O ambiente de desenvolvimento sobe com `useMocks: true`. Um `HttpInterceptor` intercepta as
requisições para `/api/**` e responde com dados semeados no `localStorage` — pessoas, equipes,
ideias, hipóteses e feedback. **Nenhum serviço .NET precisa estar rodando.**

Para desligar o modo demonstração:

```js
localStorage.setItem('bs.useMocks', 'false');
location.reload();
```

Para religar e/ou restaurar os dados de exemplo:

```js
localStorage.setItem('bs.useMocks', 'true');
localStorage.removeItem('bs.mock.db.v1');
location.reload();
```

### Conectando ao backend real

Com o modo demonstração desligado, o `proxy.conf.json` encaminha as chamadas para os serviços
locais:

| Rota               | Serviço             | Porta |
| ------------------ | ------------------- | ----- |
| `/api/user`        | UserServiceApi      | 5252  |
| `/api/team`        | TeamServiceApi      | 5236  |
| `/api/idea`        | IdeaServiceApi      | 5221  |
| `/api/hypothesis`  | HypothesisServiceApi| 5001  |
| `/api/feedbacks`   | FeedbackApi         | 5002  |
| `/api`             | Gateway             | 5000  |

As portas de Hipóteses e Feedback são placeholders até os serviços serem finalizados; ajuste em
`proxy.conf.json` se necessário.

:::info Autenticação provisória
Enquanto o backend não possui login, o frontend guarda a pessoa selecionada no `localStorage` e
envia o cabeçalho `X-User-Code` em todas as requisições. É uma solução de MVP, não de produção.
:::

## Build de produção

```bash
npm run build
```

O resultado fica em `dist/branchstorm-ui/browser`. O ambiente de produção aponta para o gateway
`https://api.branchstorm.tech` e desliga o modo demonstração.

## Testes e qualidade

```bash
npm test            # Vitest
npm run lint        # ESLint (TypeScript + templates Angular)
npm run format      # Prettier
npm run format:check
```

## Documentação

O site Docusaurus é um pacote separado em `documentation/`:

```bash
npm run docs:dev     # http://localhost:3000
npm run docs:build   # build estático
npm run docs:serve   # serve o build local
```

O build gera `documentation/build`, que pode ser publicado em `docs.branchstorm.tech`.
