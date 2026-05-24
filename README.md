# naPorta Orders API

API REST para gestão de pedidos da naPorta. Construída em **NestJS 11 +
PostgreSQL 16 + Prisma 6**, autenticada por JWT no formato Bearer e
documentada com Swagger.

**Features cobertas:**

- Criar, listar, editar e excluir pedidos (exclusão lógica)
- Filtros por número, período (`startDate`/`endDate`) e status
- Auth com access + refresh token rotacionado (Argon2id + SHA-256)
- Audit trail de mudanças de status (`OrderStatusHistory`)
- Validação CPF/CNPJ com dígito verificador
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

| Documento                                                                                                | Para que serve                                                              |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [**docs/overview.md**](./docs/overview.md)                                                               | Como o projeto funciona — camadas, fluxo de uma request, auth, persistência |
| [**docs/architecture.md**](./docs/architecture.md)                                                       | Por que foi construído desta forma — decisões de stack, DDD, trade-offs     |
| [**docs/structure.md**](./docs/structure.md)                                                             | Mapa completo do código — o que cada pasta e cada sufixo de arquivo faz     |
| [**docs/naporta-orders-api.postman_collection.json**](./docs/naporta-orders-api.postman_collection.json) | Coleção com 17 requests para Postman/Insomnia                               |

---

## Quick start

Pré-requisitos: **Node.js 20+** e **Docker** (para Postgres local). Ou
apontar o `DATABASE_URL` para um Postgres já em pé (Neon, Supabase, Render).

```bash
# 1. Clonar
git clone https://github.com/PatrickEN-dev/naporta-orders-api.git
cd naporta-orders-api

# 2. Subir Postgres local via Docker
docker compose up -d postgres

# 3. Configurar variáveis
cp .env.example .env

# 4. Instalar dependências
npm install

# 5. Aplicar migrations
npx prisma migrate deploy

# 6. (Opcional) Popular com admin + 50 pedidos de demonstração
npm run db:seed

# 7. Subir em modo dev
npm run start:dev
```

A API responde em **http://localhost:3000** e o Swagger em
**http://localhost:3000/docs**.

> O `.env.example` já vem com **placeholders válidos** para os JWT secrets
> (44 caracteres cada). Funcionam direto em dev. Em produção, gere os seus
> com `openssl rand -base64 48`.

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

## Convenções

- Commits seguem **Conventional Commits**, validados por `commitlint`
- Hook `pre-commit` roda `lint-staged` (ESLint + Prettier nos staged)
- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- Arquivos `kebab-case` com sufixo de papel (`.entity.ts`, `.use-case.ts`,
  `.service.ts`, `.dto.ts` etc — ver [docs/structure.md](./docs/structure.md))

---

## Licença

UNLICENSED — projeto de teste técnico.
