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

| Documento                                                                                                | Para que serve                                                              |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [**docs/overview.md**](./docs/overview.md)                                                               | Como o projeto funciona — camadas, fluxo de uma request, auth, persistência |
| [**docs/architecture.md**](./docs/architecture.md)                                                       | Por que foi construído desta forma — decisões de stack, DDD, trade-offs     |
| [**docs/structure.md**](./docs/structure.md)                                                             | Mapa completo do código — o que cada pasta e cada sufixo de arquivo faz     |
| [**docs/naporta-orders-api.postman_collection.json**](./docs/naporta-orders-api.postman_collection.json) | Coleção com 17 requests para Postman/Insomnia                               |

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

### Por que preciso rodar `npm run db:seed`?

O banco sobe vazio. O seed cria o usuário admin (`admin@naporta.test` /
`Admin@123`, hash Argon2id) e popula 50 pedidos fictícios com endereços,
itens e status variados para você ter dados realistas para testar
listagem, filtros e paginação. Sem o seed, o login falha (admin não
existe) e a listagem vem vazia.

### Por que a senha precisa ter 8 caracteres? E por que senha errada às vezes retorna 400 em vez de 401?

A regra no DTO de sign-in é `@MinLength(8)`. Se o cliente manda uma
string com menos de 8 caracteres, o `ValidationPipe` global rejeita
**antes** de chegar no service — daí o `400 Bad Request` com a mensagem
"password deve ter no mínimo 8 caracteres". Senha igual ou maior que 8
mas incorreta passa pelo validator, vai até o service, falha no
`argon2.verify` e retorna `401 Unauthorized` com "credenciais
inválidas".

É defesa em camadas: filtrar inputs absurdos na borda evita gastar CPU
em hash Argon2id para palpites de 1 caractere. Trade-off consciente: o
custo é vazar o requisito mínimo de 8 chars (que de qualquer forma está
documentado no Swagger).

### Por que CPF aceita com máscara (`529.982.247-25`) E sem máscara (`52998224725`)?

O `Document` value object faz `replace(/\D/g, '')` antes de validar.
Aceitar as duas formas é ergonomia para o cliente: front que envia o
valor "como digitado" funciona, e front que envia "limpo" também. No
banco fica sempre só dígitos (11 para CPF, 14 para CNPJ).

A validação roda o algoritmo oficial **mod-11** sobre os dígitos
verificadores — CPF com formato correto mas DV errado (ex:
`123.456.789-00`) é rejeitado. CPFs como `111.111.111-11` também são
recusados (todos dígitos iguais é caso especial do algoritmo).

### Por que `priceCents` é inteiro em centavos e não `price: 49.90` em reais?

Para evitar erros de ponto flutuante. JavaScript usa IEEE 754, então
`0.1 + 0.2 === 0.30000000000000004`. Em uma API que soma preços, isso
vira diferença de centavos no total do pedido — bug clássico de
e-commerce.

A solução padrão da indústria é armazenar **inteiros em centavos** e
formatar para reais só na exibição (frontend). R$ 49,90 = `4990`,
R$ 1.599,00 = `159900`. Soma, multiplicação e armazenamento são todos
exatos.

Alternativa seria `Decimal` (Prisma suporta), mas exige biblioteca de
big-decimal no client e perde simplicidade. Cents-as-int é o padrão
adotado por Stripe, Square, Mercado Pago e a maioria das APIs de
pagamento.

### Por que `totalCents` vem na response? O frontend não consegue calcular?

Três motivos:

1. **Fonte da verdade no backend.** Se o cálculo está em dois lugares
   (front e back), em algum momento eles vão divergir — alguém esquece
   de aplicar uma regra (desconto, frete, imposto). O backend é o único
   responsável pelo total.
2. **Garantia transacional.** O total é calculado dentro da mesma
   transação que persiste os itens. Se o cliente recebe `totalCents`,
   ele é exatamente o que está no banco.
3. **Auditoria.** O `totalCents` salvo é o snapshot daquele momento — se
   amanhã mudar a regra de cálculo (ex: adicionar frete), pedidos
   antigos continuam consistentes porque o valor está congelado.

O cliente pode (e deve) recalcular para validar, mas a referência é
sempre o `totalCents` que o servidor devolve.

### Por que transição de status inválida retorna `422` e não `400`?

`400 Bad Request` é usado para input mal formado (JSON quebrado, tipo
errado, campo obrigatório ausente). `422 Unprocessable Entity` é a
resposta correta quando o input está sintaticamente correto **mas viola
uma regra de negócio** — caso clássico de tentar `PENDING → DELIVERED`
pulando `IN_TRANSIT`.

A API segue a recomendação da [RFC 4918](https://datatracker.ietf.org/doc/html/rfc4918#section-11.2):
o cliente mandou JSON válido, com `status` que existe no enum, em um
recurso que existe — mas o estado atual do recurso não permite essa
mudança. Isso é 422, não 400.

### As transições de status seguem qual máquina de estado?

```
PENDING ──→ IN_TRANSIT ──→ DELIVERED  (terminal)
   │            │
   └────────────┴──→ CANCELED  (terminal)
```

Regras:

- `PENDING → DELIVERED` é proibido (pula etapa).
- `IN_TRANSIT → PENDING` é proibido (não volta).
- `DELIVERED` e `CANCELED` são terminais — não saem de lá.
- Qualquer status pode ir para `CANCELED` antes de virar `DELIVERED`.

### O que dá para editar via PATCH? Por que `customerName` e `id` não aparecem?

O DTO de update é uma **whitelist**: campos não listados são rejeitados
(`400` com `property X should not exist`).

Campos **editáveis**:

- `status` — respeitando a máquina de estado
- `deliveryAddress` — substitui o objeto inteiro
- `deliveryForecastAt`
- `items` — substitui o array inteiro (e `totalCents` é recalculado)
- `statusNote` — texto opcional registrado no `OrderStatusHistory`
  quando o `status` muda

Campos **imutáveis** (decisão de domínio):

- `id`, `number`, `createdAt`, `updatedAt`, `totalCents` — gerenciados
  pelo servidor
- `customerName`, `customerDocument` — o cliente é um snapshot do
  pedido. Mudar o nome do cliente em um pedido já criado é fraude no
  domínio de e-commerce/logística — se errou, cancela e refaz.

### Onde fica o audit trail de mudanças de status?

Tabela `OrderStatusHistory` no Postgres. Cada PATCH que mude o `status`
grava uma linha com `previousStatus`, `newStatus`, `note` e `changedAt`.
**Não é exposto via HTTP por padrão** — você consegue ver via Adminer
(`http://localhost:8080`) ou Prisma Studio (`npm run db:studio`).

Expor via `GET /v1/orders/:id/history` é um próximo passo natural.

### Posso rodar os testes?

Sim. `npm test` roda 53 testes unitários em 12 suites cobrindo value
objects, use cases, validators e o algoritmo CPF/CNPJ. `npm run test:cov`
gera cobertura.

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
