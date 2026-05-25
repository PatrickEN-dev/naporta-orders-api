# naPorta Orders API

API REST para gestão de pedidos da naPorta. Construída em **NestJS 11 +
PostgreSQL 16 + Prisma 6**, autenticada por JWT no formato Bearer e
documentada com Swagger.

**Features cobertas:**

- Criar, listar, editar e excluir pedidos (exclusão lógica)
- Filtros por número, período (`startDate`/`endDate`) e status
- Auth com access + refresh token rotacionado (Argon2id + SHA-256)
- Audit trail de mudanças de status persistido em `OrderStatusHistory`
- Validação CPF/CNPJ com dígito verificador (mod-11)
- Swagger interativo em `/docs`
- Postman Collection pronta para importar
- Docker, GitHub Actions CI, 53 testes unit, seed com dados fictícios

---

## Live — pronto para uso

A API está hospedada e funcionando. Não precisa rodar nada localmente: dá
para autenticar, criar pedidos, listar, filtrar, editar e deletar tudo
direto pelo navegador via Swagger.

👉 **https://naporta-orders-api.onrender.com/docs** — abra o Swagger, clique
em **Authorize**, use as credenciais do admin abaixo e teste todos os
endpoints.

| Recurso       | URL                                                  |
| ------------- | ---------------------------------------------------- |
| **API base**  | https://naporta-orders-api.onrender.com              |
| **Swagger**   | https://naporta-orders-api.onrender.com/docs         |
| **Liveness**  | https://naporta-orders-api.onrender.com/health       |
| **Readiness** | https://naporta-orders-api.onrender.com/health/ready |

> Serviço no **Render free tier** + banco no **Neon free tier**. O Render
> dorme após 15 min de inatividade — a primeira request depois disso pode
> levar até ~30 s para acordar.

**Credenciais do admin** (criadas pelo seed):

```
email:    admin@naporta.test
senha:    Admin@123
```

---

## Stack

NestJS 11 · PostgreSQL 16 · Prisma 6 · JWT (Argon2id + SHA-256) ·
class-validator · zod · nestjs-pino · Swagger/OpenAPI · Jest + Supertest ·
Docker multistage · GitHub Actions

---

## Documentação

| Documento                                                                                                | Para que serve                                                                               |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [**docs/overview.md**](./docs/overview.md)                                                               | Como o projeto funciona — camadas, fluxo de uma request, auth, persistência                  |
| [**docs/architecture.md**](./docs/architecture.md)                                                       | Por que foi construído desta forma — decisões de stack, DDD, trade-offs                      |
| [**docs/structure.md**](./docs/structure.md)                                                             | Mapa completo do código — o que cada pasta e cada sufixo de arquivo faz                      |
| [**docs/faq.md**](./docs/faq.md)                                                                         | Tira-dúvidas técnico completo: env, auth, domínio, bibliotecas, deploy. Indexado por keyword |
| [**docs/naporta-orders-api.postman_collection.json**](./docs/naporta-orders-api.postman_collection.json) | Coleção com 17 requests para Postman/Insomnia                                                |

---

## Rodar a API — 3 caminhos

Escolha um. Os três terminam no mesmo lugar: Swagger em `/docs`, login com
o admin do seed, todos os endpoints funcionando.

### Caminho 1 — Render (sem clonar nada)

Já está no ar. Abre o link, faz login, testa.

```
https://naporta-orders-api.onrender.com/docs
admin@naporta.test / Admin@123
```

Free tier dorme após 15 min. Primeira request depois disso pode levar ~30 s.

---

### Caminho 2 — 100% Docker (recomendado para o recrutador)

Sobe Postgres, API e Adminer em containers. **Não precisa instalar Node**,
não precisa instalar Postgres, não precisa editar nenhum arquivo.

```bash
git clone https://github.com/PatrickEN-dev/naporta-orders-api.git
cd naporta-orders-api
cp .env.example .env
docker compose up -d --build
docker exec naporta-api npm run db:seed
```

Pronto. API em `http://localhost:3000/docs`, Adminer em
`http://localhost:8080` (servidor `postgres`, usuário `naporta`, senha
`naporta`, banco `naporta`).

> O `docker-compose.yml` define **três serviços** (`postgres`, `api`,
> `adminer`). `docker compose up -d --build` sobe todos. O `db:seed` precisa
> ser disparado uma vez para criar o admin e popular 50 pedidos.

Para derrubar tudo: `docker compose down -v` (o `-v` apaga o volume do
banco, útil para começar do zero).

---

### Caminho 3 — Localhost (Node + Postgres em container)

Para quem quer rodar a API em modo dev com hot reload e ver os logs no
terminal.

```bash
git clone https://github.com/PatrickEN-dev/naporta-orders-api.git
cd naporta-orders-api

docker compose up -d postgres    # só o Postgres
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev                # API em http://localhost:3000
```

Pré-requisitos: **Node.js 20+** e Docker (apenas para o Postgres). Se já
tem um Postgres rodando local ou um remoto (Neon, Supabase, Render), basta
apontar `DATABASE_URL` no `.env` e pular o `docker compose up -d postgres`.

---

> O `.env.example` já vem com **placeholders válidos** para os JWT secrets
> (44 caracteres cada). Funcionam direto em dev. Em produção, gere os seus
> com `openssl rand -base64 48` (rodar duas vezes — um para
> `JWT_ACCESS_SECRET`, outro para `JWT_REFRESH_SECRET`).

---

## Testar a API

### 1. Swagger (mais simples)

1. Acessa `http://localhost:3000/docs`
2. Em `POST /v1/auth/sign-in` clica **Try it out** e usa as credenciais do admin
3. Copia o `accessToken` da resposta
4. Clica em **Authorize** (canto superior direito) e cola o token
5. Todos os endpoints `/v1/orders` ficam disponíveis

### 2. Postman / Insomnia

Importa
[`docs/naporta-orders-api.postman_collection.json`](./docs/naporta-orders-api.postman_collection.json).
A coleção tem **17 requests** em 3 folders (Auth, Orders, Health). Scripts
capturam `accessToken`, `refreshToken` e `orderId` automaticamente após o
sign-in.

### 3. curl

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@naporta.test","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/v1/orders

curl -X POST http://localhost:3000/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Mariana Silva",
    "customerDocument": "529.982.247-25",
    "deliveryAddress": {
      "zipCode": "01310100", "street": "Av. Paulista", "number": "1578",
      "district": "Bela Vista", "city": "São Paulo", "state": "SP"
    },
    "deliveryForecastAt": "2028-12-31T18:00:00.000Z",
    "items": [
      { "description": "Camiseta", "priceCents": 4990, "quantity": 2 },
      { "description": "Bermuda",  "priceCents": 8990, "quantity": 1 }
    ]
  }'
```

---

## Endpoints

Prefixo global `/v1`. Documentação interativa em `/docs`.

| Método   | Rota                | Auth    | Função                                             |
| -------- | ------------------- | ------- | -------------------------------------------------- |
| `POST`   | `/v1/auth/sign-in`  | público | Login (email/senha)                                |
| `POST`   | `/v1/auth/refresh`  | público | Rotaciona o par access + refresh                   |
| `POST`   | `/v1/auth/sign-out` | Bearer  | Revoga o refresh do usuário atual                  |
| `POST`   | `/v1/orders`        | Bearer  | Cria pedido                                        |
| `GET`    | `/v1/orders`        | Bearer  | Lista com filtros e paginação                      |
| `GET`    | `/v1/orders/:id`    | Bearer  | Detalhe do pedido                                  |
| `PATCH`  | `/v1/orders/:id`    | Bearer  | Edição parcial (status, items, endereço, forecast) |
| `DELETE` | `/v1/orders/:id`    | Bearer  | Exclusão lógica                                    |
| `GET`    | `/health`           | público | Liveness                                           |
| `GET`    | `/health/ready`     | público | Readiness (memória + DB)                           |

### Filtros da listagem

```
GET /v1/orders?number=ORD-2026-000123
              &startDate=2026-01-01T00:00:00.000Z
              &endDate=2026-05-31T23:59:59.999Z
              &status=PENDING
              &page=1
              &limit=20
              &sort=-createdAt
```

- `number` — match exato
- `startDate` / `endDate` — intervalo em `createdAt`, ambos opcionais
- `status` — `PENDING | IN_TRANSIT | DELIVERED | CANCELED`
- `page` — `>= 1` (default `1`)
- `limit` — `1..100` (default `20`)
- `sort` — `createdAt` ou `deliveryForecastAt`. Prefixo `-` = descendente

---

## Scripts npm

### Dev

| Script               | Função                           |
| -------------------- | -------------------------------- |
| `npm run start:dev`  | API com hot reload (porta 3000)  |
| `npm run start:prod` | Executa o build (`dist/main.js`) |
| `npm run build`      | Compila TypeScript para `dist/`  |

### Banco

| Script                | Função                          |
| --------------------- | ------------------------------- |
| `npm run db:generate` | Gera o Prisma Client            |
| `npm run db:migrate`  | Cria e aplica migrations em dev |
| `npm run db:deploy`   | Aplica migrations em produção   |
| `npm run db:studio`   | Abre o Prisma Studio            |
| `npm run db:seed`     | Popula com admin + ~50 pedidos  |

### Qualidade

| Script                 | Função                                         |
| ---------------------- | ---------------------------------------------- |
| `npm run lint`         | ESLint com `--fix`                             |
| `npm run lint:check`   | ESLint sem auto-fix, falha em qualquer warning |
| `npm run format`       | Prettier write                                 |
| `npm run format:check` | Prettier check                                 |
| `npm run typecheck`    | `tsc --noEmit`                                 |

### Testes

| Script             | Função                        |
| ------------------ | ----------------------------- |
| `npm test`         | Testes unit (53 em 12 suites) |
| `npm run test:cov` | Cobertura                     |
| `npm run test:e2e` | End-to-end                    |

---

## Variáveis de ambiente

Validadas por **zod** no boot — a app não sobe com env inválida.

| Variável               | Default       | Descrição                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------ |
| `NODE_ENV`             | `development` | `development` \| `test` \| `production`                      |
| `PORT`                 | `3000`        | Porta HTTP                                                   |
| `LOG_LEVEL`            | `info`        | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |
| `DATABASE_URL`         | —             | Connection string Postgres                                   |
| `JWT_ACCESS_SECRET`    | —             | Segredo do access token (≥ 32 chars)                         |
| `JWT_REFRESH_SECRET`   | —             | Segredo do refresh token (≥ 32 chars)                        |
| `JWT_ACCESS_TTL`       | `15m`         | TTL do access                                                |
| `JWT_REFRESH_TTL`      | `7d`          | TTL do refresh                                               |
| `CORS_ORIGINS`         | `*`           | Lista por vírgula. `*` bloqueado em produção                 |
| `RATE_LIMIT_TTL`       | `60`          | Janela do rate limit (segundos)                              |
| `RATE_LIMIT_MAX`       | `100`         | Requests por janela por IP                                   |
| `TRUST_PROXY`          | `0`           | Hops de proxy confiáveis. Use `1` atrás de LB                |
| `MEMORY_HEAP_LIMIT_MB` | `256`         | Threshold do health check                                    |
| `DB_PING_TIMEOUT_MS`   | `2000`        | Timeout do readiness check                                   |

Gerar secrets seguros: `openssl rand -base64 48` (rodar duas vezes).

---

## Qualidade

- **53 testes** unitários em 12 suites (`npm test`)
- **17 requests** prontas no Postman/Insomnia (folders: Auth, Orders, Health)
- **48 cenários** validados manualmente em ambiente real (válidos + edge
  cases: CPF inválido, transição inválida, mass assignment, soft delete, etc)
- **CI** roda em cada push: lint, format, typecheck, test, build, docker build
- **Check constraints** no Postgres como defesa em profundidade

---

## Tira-dúvidas

Documento completo: [**docs/faq.md**](./docs/faq.md). Indexado por
keyword — use **Ctrl+F** com qualquer termo abaixo para pular direto à
resposta.

### Configuração e variáveis de ambiente

`NODE_ENV` (`development` vs `production`) · `PORT` · `LOG_LEVEL`
(`pino`, `debug`, `info`) · `DATABASE_URL` (`Postgres`, `Neon`,
`pooler`) · `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` (`openssl
rand`) · `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` (`15m`, `7d`) ·
`CORS_ORIGINS` · `TRUST_PROXY` (`load balancer`, `X-Forwarded-For`) ·
`RATE_LIMIT_TTL` + `RATE_LIMIT_MAX` (`Throttler`, `429`) ·
`MEMORY_HEAP_LIMIT_MB` (`health check`) · `DB_PING_TIMEOUT_MS`
(`readiness`).

### Autenticação e segurança

senha mínima 8 chars · `400 vs 401` · `Argon2id` (vs `bcrypt`) ·
`jti` no JWT (`replay protection`) · `refresh token rotation` · hash
`SHA-256` no banco · `sign-out`.

### Domínio e regras de negócio

`CPF` / `CNPJ` com `máscara` opcional · validação `mod-11` ·
`priceCents` int em centavos (`IEEE 754`, vs `float`, vs `Decimal`)
· `subtotalCents` · `totalCents` (`fonte da verdade`, `snapshot`,
`auditoria`) · `statusNote` · máquina de estado `PENDING` →
`IN_TRANSIT` → `DELIVERED` / `CANCELED` · `soft delete` com
`deletedAt` · `audit trail` em `order_status_history`.

### HTTP, contratos e respostas

`400 vs 422` (`RFC 4918`) · formato padronizado de erro (`code`,
`message`, `details`, `requestId`) · paginação `{data, meta}` ·
filtros `startDate`/`endDate`/`status`/`sort` · proteção contra
`mass assignment` (`whitelist`, `forbidNonWhitelisted`).

### Bibliotecas — por que cada uma

`NestJS` (vs `Express`, vs `Fastify`, vs `Go`) · `Prisma` (vs
`TypeORM`, vs `Sequelize`) · `Postgres` (vs `MongoDB`) · `zod` no
env vs `class-validator` no HTTP · `class-transformer` ·
`nestjs-pino` (vs `Winston`) · `Helmet` (`CSP`, `HSTS`, `XSS`) ·
`@nestjs/throttler` · `@nestjs/swagger` · `Passport` +
`passport-jwt` · `tsx` (vs `ts-node`) · `@faker-js/faker` · `Husky`

- `commitlint` + `lint-staged`.

### Banco e persistência

`OrderNumber` via Postgres `SEQUENCE` (`nextval`, `race
condition`) · `OrderItem` em tabela (vs `JSONB`) · `CHECK
constraints` como defesa em profundidade · seed idempotente com
`Argon2` + `Faker`.

### Arquitetura

`DDD tático` (vs `Clean Architecture`) · `Value Object` (`Money`,
`Document`, `Address`, `OrderNumber`) · `Aggregate Root` (`Order`
governa `OrderItem`) · `Use Case` · `Repository pattern` (`port and
adapter`, `InMemoryOrderRepository` em testes).

### Operação, testes e deploy

`npm run db:seed` · `prisma migrate dev` vs `migrate deploy` ·
`Jest` + `Supertest` · `CI` no `GitHub Actions` · `Docker
multistage` (`node:22-alpine`, non-root) · deploy no `Render` +
`Neon` (`free tier`, `cold start`) · `docker compose down -v` para
reset.

---

## Convenções

- Commits seguem **Conventional Commits**, validados por `commitlint`
- Hook `pre-commit` roda `lint-staged` (ESLint + Prettier nos staged)
- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- Arquivos `kebab-case` com sufixo de papel (`.entity.ts`, `.use-case.ts`,
  `.service.ts`, `.dto.ts` etc — ver [docs/structure.md](./docs/structure.md))

---

## Licença

UNLICENSED — projeto de teste técnico.
