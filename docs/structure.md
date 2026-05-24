# O que cada arquivo / pasta faz

Mapa completo do código.

- **Como funciona** → [`overview.md`](./overview.md)
- **Por que dessa forma** → [`architecture.md`](./architecture.md)

---

## Visão geral

```
src/
├── main.ts                     bootstrap (Helmet, Pino, Swagger, CORS, etc.)
├── app.module.ts               raiz: imports + guards globais + filter
├── config/                     validação de env (zod)
├── shared/                     bases sem dependência de framework
├── common/                     utilitários da camada HTTP (Nest)
├── infra/                      Prisma, Logger, Health
└── modules/                    domínios de negócio (auth, users, orders)
```

Os arquivos da **raiz** (Dockerfile, docker-compose, package.json, configs do
TS/ESLint/Prettier, husky, commitlint, README) ficam fora dessa árvore — são
infra/devex e estão descritos em [arquivos da raiz](#arquivos-da-raiz).

---

## `src/main.ts`

Bootstrap em ordem:

1. Cria o app com `bufferLogs: true`
2. Substitui o logger padrão pelo Pino
3. Configura `trust proxy` se for usar atrás de LB
4. Habilita Helmet, CORS (whitelist via env), prefixo global `/v1`
5. Aplica `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
6. Habilita `enableShutdownHooks` (importante pro Render terminar com graça)
7. Monta o Swagger em `/docs`

## `src/app.module.ts`

Módulo raiz. Importa todos os outros e registra como providers globais:

- `ThrottlerGuard` (rate limit)
- `JwtAuthGuard` (Bearer)
- `AllExceptionsFilter` (formato de erro padrão)

A **ordem** dos providers globais importa: o Throttler dispara antes do
JwtAuthGuard. Assim, requests rate-limitadas nem chegam à validação de token.

---

## `src/config/`

| Arquivo                | Função                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `env.schema.ts`        | Schema zod com todas as envs. Refinements bloqueiam `CORS=*` em produção e secrets JWT iguais  |
| `app-config.module.ts` | Registra `ConfigModule` global com `validate` ligado ao schema. App não sobe se env é inválida |

---

## `src/shared/` — domínio puro, zero framework

| Arquivo                         | Função                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/entity.base.ts`         | `id` + `equals` por id                                                                                                                                   |
| `domain/value-object.base.ts`   | Imutável (`Object.freeze`), `equals` por props (deep compare)                                                                                            |
| `domain/aggregate-root.base.ts` | Base com lista de domain events (`pullEvents()`)                                                                                                         |
| `domain/domain-event.ts`        | Interface marker (`name`, `occurredAt`)                                                                                                                  |
| `errors/domain.error.ts`        | `DomainError` abstrata + 4 subclasses (`NotFoundError`, `InvalidStateError`, `ValidationError`, `UnauthorizedError`). Cada uma tem `code` e `httpStatus` |
| `services/uuid.service.ts`      | Wrapper de `randomUUID()` para mockabilidade nos testes                                                                                                  |

---

## `src/common/` — utilitários HTTP/Nest

| Arquivo                                | Função                                                                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters/all-exceptions.filter.ts`     | Captura qualquer exception. Mapeia `DomainError` → status do erro, `HttpException` → resposta padronizada, qualquer outra → 500. Sempre inclui `requestId` |
| `guards/jwt-auth.guard.ts`             | Extende `AuthGuard('jwt')`, respeita `@Public()`                                                                                                           |
| `decorators/public.decorator.ts`       | Marca rotas que ignoram o guard global                                                                                                                     |
| `decorators/current-user.decorator.ts` | Extrai `req.user` (populado pela JwtStrategy)                                                                                                              |
| `http/request-with-id.ts`              | Tipo do Express request com `id` injetado pelo Pino                                                                                                        |

---

## `src/infra/` — adaptadores técnicos

| Arquivo                        | Função                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `prisma/prisma.service.ts`     | Estende `PrismaClient` + aplica Client Extension de soft-delete. Expõe `db` (extended) e `base` (cru) + `ping()` com timeout |
| `prisma/prisma.module.ts`      | Registra global                                                                                                              |
| `logger/pino-logger.config.ts` | Factory do Pino com redaction de PII, requestId, custom log level por status code                                            |
| `logger/logger.module.ts`      | Registra `nestjs-pino`                                                                                                       |
| `health/health.controller.ts`  | `/health` (memória) e `/health/ready` (memória + DB)                                                                         |
| `health/prisma.health.ts`      | Indicador custom Terminus que faz `ping` no Postgres                                                                         |
| `health/health.module.ts`      | Registra controller + indicator                                                                                              |

---

## `src/modules/` — domínios de negócio

Cada módulo segue **três camadas**:

```
modules/<nome>/
├── domain/          regras de negócio (zero framework)
├── application/     casos de uso
└── infra/           Prisma + HTTP
```

### Convenção `.use-case.ts` vs `.service.ts`

Os dois sufixos coexistem com **significados diferentes**:

| Sufixo         | Onde mora                                              | O que é                                                                                                        |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `.use-case.ts` | `<modulo>/application/use-cases/`                      | **Caso de uso** orquestrando um fluxo de negócio (`CreateOrderUseCase`, `SignInUseCase`, ...)                  |
| `.service.ts`  | `<modulo>/application/services/` ou `shared/services/` | **Serviço técnico** reutilizável e sem fluxo de negócio próprio (`HashService`, `TokenService`, `UuidService`) |

**Regra prática:** se o nome do arquivo é um verbo (criar, listar, fazer
sign-in), é `.use-case`. Se é um substantivo de utilidade técnica (Hash,
Token, Uuid), é `.service`.

### `src/modules/auth/`

#### domain

| Arquivo                           | Função                                                  |
| --------------------------------- | ------------------------------------------------------- |
| `application/dtos/auth-tokens.ts` | Interfaces internas (`AuthTokens`, `AuthenticatedUser`) |

> _Auth não tem `domain/` próprio: a `User` entity vive em `users/`, e os DTOs
> internos do auth vivem em `application/dtos/`._

#### application

| Arquivo                               | Função                                                   |
| ------------------------------------- | -------------------------------------------------------- |
| `services/hash.service.ts`            | Argon2id (senha) + SHA-256 (token) + timing-safe compare |
| `services/token.service.ts`           | Emite/verifica JWT access + refresh                      |
| `use-cases/sign-in.use-case.ts`       | Valida credenciais, emite par, persiste hash do refresh  |
| `use-cases/refresh-token.use-case.ts` | Rotaciona par; revoga em replay detectado                |
| `use-cases/sign-out.use-case.ts`      | Apaga hash do refresh                                    |

#### infra

| Arquivo                      | Função                                            |
| ---------------------------- | ------------------------------------------------- |
| `strategies/jwt.strategy.ts` | passport-jwt: extrai e valida o Bearer            |
| `http/auth.controller.ts`    | 3 endpoints                                       |
| `http/dtos/*.dto.ts`         | Request/response DTOs (class-validator + Swagger) |

`auth.module.ts` — wiring + `JwtModule`.

### `src/modules/users/`

#### domain

| Arquivo                           | Função                                          |
| --------------------------------- | ----------------------------------------------- |
| `entities/user.entity.ts`         | Entity readonly (id, email, hashes, timestamps) |
| `repositories/user.repository.ts` | Interface + DI token                            |

#### infra

| Arquivo                                 | Função                                                     |
| --------------------------------------- | ---------------------------------------------------------- |
| `persistence/user.mapper.ts`            | Prisma row → User entity                                   |
| `persistence/prisma-user.repository.ts` | Implementa `findById`, `findByEmail`, `updateRefreshToken` |

#### tests

| Arquivo                                  | Função                                      |
| ---------------------------------------- | ------------------------------------------- |
| `__tests__/in-memory-user.repository.ts` | Fake para testes unit dos use cases de auth |

`users.module.ts` — wiring.

### `src/modules/orders/`

#### domain — regras de negócio puras

| Arquivo                                | Função                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `entities/order.entity.ts`             | Aggregate Root: `changeStatus`, `replaceItems`, `softDelete`, recalcula `totalCents`, dispara eventos |
| `entities/order-item.entity.ts`        | Entity: description, price, quantity, subtotal                                                        |
| `value-objects/order-number.vo.ts`     | Formata/valida `ORD-YYYY-NNNNNN`                                                                      |
| `value-objects/money.vo.ts`            | Centavos com soma, formatação BRL                                                                     |
| `value-objects/document.vo.ts`         | Valida CPF/CNPJ **com dígito verificador**                                                            |
| `value-objects/address.vo.ts`          | Normaliza CEP/UF, default `BR`                                                                        |
| `value-objects/order-status.vo.ts`     | Máquina de estados com transições permitidas                                                          |
| `events/order-created.event.ts`        | Disparado em `Order.create()`                                                                         |
| `events/order-status-changed.event.ts` | Disparado em `Order.changeStatus()`. Carrega `notes` opcional                                         |
| `repositories/order.repository.ts`     | Interface + `OrderFilters`, `ListOrdersOptions`, `PaginatedOrders`                                    |

#### application — orquestração

| Arquivo                                   | Função                                                   |
| ----------------------------------------- | -------------------------------------------------------- |
| `dtos/*.input.ts`                         | Inputs internos dos use cases (objetos planos)           |
| `use-cases/create-order.use-case.ts`      | Cria, valida, persiste                                   |
| `use-cases/list-orders.use-case.ts`       | Pagina + ordena + filtra                                 |
| `use-cases/find-order.use-case.ts`        | Busca por id ou 404                                      |
| `use-cases/update-order.use-case.ts`      | Aplica diff de update (status, items, address, forecast) |
| `use-cases/soft-delete-order.use-case.ts` | Marca `deletedAt`                                        |

#### infra — Prisma e HTTP

| Arquivo                                  | Função                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `persistence/order.mapper.ts`            | Prisma row → Order aggregate                                                                                             |
| `persistence/prisma-order.repository.ts` | Implementa `findById/list/save/nextSequence`. Save usa `$transaction` + persiste eventos como `OrderStatusHistory`       |
| `http/orders.controller.ts`              | 5 endpoints (CRUD + soft delete)                                                                                         |
| `http/dtos/*.dto.ts`                     | Request DTOs (`CreateOrderRequestDto`, `UpdateOrderRequestDto`, `ListOrdersQueryDto`, `OrderAddressDto`, `OrderItemDto`) |
| `http/presenters/order.presenter.ts`     | Domain Order → HTTP response. Define `OrderResponse`, `PaginatedOrdersResponse` para Swagger                             |

#### tests

| Arquivo                                   | Função                |
| ----------------------------------------- | --------------------- |
| `__tests__/in-memory-order.repository.ts` | Fake para testes unit |

`orders.module.ts` — wiring.

---

## `prisma/`

| Arquivo                                                            | Função                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `schema.prisma`                                                    | Modelos: User, Order, OrderItem, OrderStatusHistory + enum `OrderStatus`    |
| `migrations/<timestamp>_init/`                                     | Tabelas, índices, enum                                                      |
| `migrations/<timestamp>_add_quantity_total_notes_and_constraints/` | quantity, totalCents, notes, sequence `order_number_seq`, check constraints |
| `seed.ts`                                                          | Admin + ~50 pedidos com CPF/CNPJ válidos via faker-js                       |

---

## Sufixos de arquivo — referência rápida

| Sufixo           | Camada                             | Papel                                     |
| ---------------- | ---------------------------------- | ----------------------------------------- |
| `.entity.ts`     | domain                             | Entity / aggregate root com comportamento |
| `.vo.ts`         | domain                             | Value object imutável                     |
| `.event.ts`      | domain                             | Domain event                              |
| `.repository.ts` | domain (interface) ou infra (impl) | Porta de persistência                     |
| `.use-case.ts`   | application                        | Caso de uso (verbo)                       |
| `.service.ts`    | application ou shared              | Serviço técnico (substantivo)             |
| `.input.ts`      | application                        | Input plano de use case                   |
| `.dto.ts`        | infra/http                         | DTO HTTP com class-validator              |
| `.controller.ts` | infra/http                         | Controller Nest                           |
| `.presenter.ts`  | infra/http                         | Domain → HTTP response                    |
| `.mapper.ts`     | infra/persistence                  | Prisma row ↔ domain                       |
| `.strategy.ts`   | infra                              | Passport strategy                         |
| `.guard.ts`      | common                             | Guard Nest                                |
| `.filter.ts`     | common                             | Exception filter                          |
| `.decorator.ts`  | common                             | Decorator custom                          |
| `.module.ts`     | qualquer                           | Wiring Nest                               |
| `.spec.ts`       | qualquer                           | Teste unit (Jest)                         |
| `.e2e-spec.ts`   | test/                              | Teste end-to-end                          |

---

## Onde adicionar coisas novas

| Quero...                        | Onde mexer                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Novo endpoint de orders         | `orders.controller.ts` + novo use case correspondente                                                     |
| Nova regra de negócio em pedido | Método em `order.entity.ts` (com domain event se aplicável)                                               |
| Novo filtro na listagem         | Campo em `OrderFilters` → uso em `list-orders.use-case.ts` → `buildWhere` em `prisma-order.repository.ts` |
| Nova variável de ambiente       | `src/config/env.schema.ts` + `.env.example`                                                               |
| Novo módulo (ex: notifications) | Criar `src/modules/<nome>/` com as 3 camadas e adicionar ao `app.module.ts`                               |
| Novo health check               | Provider em `src/infra/health/` adicionado à lista do `HealthController`                                  |
| Novo path para redaction de log | Array `REDACTED_PATHS` em `pino-logger.config.ts`                                                         |
| Migration nova                  | `npx prisma migrate dev --name <descrição>`                                                               |

---

## Arquivos da raiz

| Arquivo                    | Função                                                                     |
| -------------------------- | -------------------------------------------------------------------------- |
| `Dockerfile`               | Multistage: deps, build, runtime. Non-root, node:20-alpine                 |
| `docker-compose.yml`       | Postgres 16 + Adminer (8080) + API                                         |
| `package.json`             | Deps, scripts, config do lint-staged e Jest                                |
| `tsconfig.json`            | TS strict + `noUnusedLocals` + `noImplicitOverride`                        |
| `tsconfig.build.json`      | `rootDir: src`, exclui prisma/test/specs (faz `dist/main.js` cair na raiz) |
| `eslint.config.mjs`        | Flat config + type-checked rules + Prettier integrado                      |
| `.prettierrc`              | Estilo Prettier                                                            |
| `commitlint.config.cjs`    | Conventional Commits                                                       |
| `.husky/pre-commit`        | Roda `lint-staged`                                                         |
| `.husky/commit-msg`        | Roda `commitlint --edit "$1"`                                              |
| `.env.example`             | Template com placeholders válidos (JWT secrets ≥ 32 chars)                 |
| `.dockerignore`            | Exclui node_modules, dist, .git do build do Docker                         |
| `.github/workflows/ci.yml` | CI: lint, format, typecheck, test, build, docker build                     |
