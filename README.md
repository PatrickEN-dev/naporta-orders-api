# naPorta Orders API

API REST para gestão de pedidos do portal naPorta. Implementa criação,
listagem com filtros, edição e exclusão lógica de pedidos, protegida por
JWT no formato Bearer.

## Stack

| Camada       | Tecnologia                            |
| ------------ | ------------------------------------- |
| Runtime      | Node.js 20 LTS                        |
| Framework    | NestJS 11                             |
| Linguagem    | TypeScript 5                          |
| Banco        | PostgreSQL 16                         |
| ORM          | Prisma 6                              |
| Autenticação | JWT (access + refresh) com Argon2id   |
| Validação    | class-validator (payload) + zod (env) |
| Logger       | nestjs-pino                           |
| Documentação | Swagger / OpenAPI                     |
| Testes       | Jest + Supertest                      |
| Container    | Docker (multistage) + docker-compose  |
| CI           | GitHub Actions                        |

### Justificativa da stack

NestJS, PostgreSQL e Prisma são as preferências explícitas do desafio.
JWT no formato Bearer atende ao requisito de autenticação. Argon2id substitui
bcrypt por ser o algoritmo vencedor do PHC e padrão atual de produção.

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Docker e docker-compose (opcional, recomendado para o Postgres)

## Setup

```bash
git clone https://github.com/PatrickEN-dev/naporta-orders-api.git
cd naporta-orders-api
cp .env.example .env
npm install
npm run start:dev
```

Após subir, a aplicação fica disponível em:

- API: `http://localhost:3000/v1`
- Swagger: `http://localhost:3000/docs`
- Liveness: `http://localhost:3000/health`
- Readiness: `http://localhost:3000/health/ready`

## Variáveis de ambiente

Validadas por zod no boot — o app não sobe com env inválida.

| Variável             | Default       | Descrição                                                    |
| -------------------- | ------------- | ------------------------------------------------------------ |
| `NODE_ENV`           | `development` | `development` \| `test` \| `production`                      |
| `PORT`               | `3000`        | Porta HTTP                                                   |
| `LOG_LEVEL`          | `info`        | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |
| `DATABASE_URL`       | —             | URL de conexão Postgres                                      |
| `JWT_ACCESS_SECRET`  | —             | Segredo do access token (mínimo 32 caracteres)               |
| `JWT_REFRESH_SECRET` | —             | Segredo do refresh token (mínimo 32 caracteres)              |
| `JWT_ACCESS_TTL`     | `15m`         | TTL do access token (`15m`, `1h`, ...)                       |
| `JWT_REFRESH_TTL`    | `7d`          | TTL do refresh token                                         |
| `CORS_ORIGINS`       | `*`           | Lista separada por vírgula, ou `*`                           |
| `RATE_LIMIT_TTL`     | `60`          | Janela do rate limit em segundos                             |
| `RATE_LIMIT_MAX`     | `100`         | Requests por janela por IP                                   |

Gerar segredos seguros:

```bash
openssl rand -base64 48
```

## Scripts

| Script                 | Função                                         |
| ---------------------- | ---------------------------------------------- |
| `npm run start:dev`    | Sobe a API com hot reload                      |
| `npm run start:prod`   | Executa a build de produção (`dist/main.js`)   |
| `npm run build`        | Compila TypeScript para `dist/`                |
| `npm run lint`         | Roda ESLint com `--fix`                        |
| `npm run lint:check`   | ESLint sem auto-fix, falha em qualquer warning |
| `npm run format`       | Prettier write                                 |
| `npm run format:check` | Prettier check                                 |
| `npm run typecheck`    | `tsc --noEmit`                                 |
| `npm test`             | Testes unitários (Jest)                        |
| `npm run test:cov`     | Testes com cobertura                           |
| `npm run test:e2e`     | Testes end-to-end (Supertest)                  |
| `npm run db:generate`  | Gera o Prisma Client                           |
| `npm run db:migrate`   | Roda migrações em desenvolvimento              |
| `npm run db:deploy`    | Aplica migrações em produção                   |
| `npm run db:studio`    | Abre Prisma Studio                             |
| `npm run db:seed`      | Popula o banco com dados de demonstração       |

## Endpoints

Prefixo global `/v1`. Documentação completa em `/docs` (Swagger).

| Método   | Rota                | Descrição                             |
| -------- | ------------------- | ------------------------------------- |
| `POST`   | `/v1/auth/sign-in`  | Autenticação por email/senha          |
| `POST`   | `/v1/auth/refresh`  | Rotação do par access + refresh       |
| `POST`   | `/v1/auth/sign-out` | Revoga o refresh token atual          |
| `POST`   | `/v1/orders`        | Cria pedido                           |
| `GET`    | `/v1/orders`        | Lista pedidos com filtros e paginação |
| `GET`    | `/v1/orders/:id`    | Detalhe do pedido                     |
| `PATCH`  | `/v1/orders/:id`    | Edição parcial                        |
| `DELETE` | `/v1/orders/:id`    | Exclusão lógica                       |
| `GET`    | `/health`           | Liveness                              |
| `GET`    | `/health/ready`     | Readiness                             |

### Filtros da listagem

```
GET /v1/orders?number=ORD-2026-000123
              &startDate=2026-01-01
              &endDate=2026-05-31
              &status=PENDING
              &page=1
              &limit=20
              &sort=-createdAt
```

- `number` — match exato no número do pedido
- `startDate` / `endDate` — intervalo fechado em `createdAt`
- `status` — `PENDING` \| `IN_TRANSIT` \| `DELIVERED` \| `CANCELED`
- `sort` — prefixo `-` indica descendente

## Estrutura do projeto

```
src/
├── config/          ConfigModule + validação zod
├── shared/          domínio puro (entidades, value objects, erros)
├── common/          guards, filtros, decorators, paginação
├── infra/           Prisma, logger, health
└── modules/         auth, users, orders (domain → application → infra)
prisma/              schema, migrations, seed
test/                e2e
```

Cada módulo de negócio segue três camadas:

- `domain/` — entidades, value objects, eventos, interfaces de repositório
- `application/` — casos de uso, DTOs internos, listeners
- `infra/` — implementação de repositórios (Prisma), controllers HTTP, mappers

## Testes

```bash
npm test            # unit
npm run test:cov    # com cobertura
npm run test:e2e    # end-to-end
```

E2E exige Postgres acessível pela `DATABASE_URL`.

## Convenções

- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
- `pre-commit` roda lint-staged (ESLint + Prettier nos arquivos staged)
- `commit-msg` valida a mensagem via commitlint
- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`

## Licença

UNLICENSED — projeto de teste técnico.
