# Como o projeto funciona

Esta doc cobre o **como**: o que acontece quando uma request entra, como as
camadas se organizam, como o auth flui. Para o **por quê** das decisões, veja
[`architecture.md`](./architecture.md). Para **onde mora cada coisa** no
código, veja [`structure.md`](./structure.md).

---

## Em uma frase

API REST de pedidos: cria, lista (com filtros), edita e faz soft-delete,
tudo protegido por JWT Bearer e documentado no Swagger em `/docs`.

---

## As 4 camadas

O código vive em quatro camadas. O domínio é o núcleo e não conhece nada do
mundo externo (HTTP, Prisma, Nest). As camadas externas dependem das internas,
nunca o contrário.

```
HTTP    ──►  Controllers, DTOs HTTP, Guards, Presenters
              (recebe, valida, traduz pra input do use case)
                │
                ▼
APP     ──►  Use cases, DTOs internos
              (orquestra domínio + repositório; sem HTTP, sem ORM)
                │
                ▼
DOMAIN  ──►  Entities, Value Objects, eventos, interfaces de repositório
              (regras de negócio puras)
                ▲
                │
INFRA   ──►  Repositórios Prisma, mappers
              (implementa a porta do domínio)
```

Quando uma request chega, ela atravessa de cima pra baixo. Quando a resposta
volta, é o caminho inverso, com o presenter convertendo VOs em primitivos
limpos.

---

## Um exemplo concreto: criar um pedido

**Request:**

```http
POST /v1/orders
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "customerName": "Mariana Silva",
  "customerDocument": "529.982.247-25",
  "deliveryAddress": {
    "zipCode": "01310100",
    "street": "Av. Paulista",
    "number": "1578",
    "district": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  },
  "deliveryForecastAt": "2028-12-31T18:00:00.000Z",
  "items": [
    { "description": "Camiseta", "priceCents": 4990, "quantity": 2 },
    { "description": "Bermuda",  "priceCents": 8990, "quantity": 1 }
  ]
}
```

**O que acontece por dentro (resumo):**

1. Helmet, Throttler e o `JwtAuthGuard` deixam a request passar
2. O `ValidationPipe` valida o DTO (class-validator); rejeita campos extras
3. O `CreateOrderUseCase` monta os Value Objects (`Document` valida o dígito
   verificador do CPF, `Address` normaliza o CEP, `Money` guarda centavos)
4. Pede o próximo número de pedido (`SELECT nextval('order_number_seq')`)
5. Cria o aggregate `Order` — que valida as invariantes (precisa ter items,
   forecast no futuro, nome não vazio) e calcula `totalCents`
6. O repositório salva tudo numa única transação Prisma: upsert do pedido e
   insert na `OrderStatusHistory` (entrada inicial vinda do domain event)
7. O `OrderPresenter` converte o aggregate em JSON limpo

**Response:**

```json
{
  "id": "67fb6c5f-0653-4d94-8750-ea97799e7aef",
  "number": "ORD-2026-000052",
  "customerName": "Mariana Silva",
  "customerDocument": "52998224725",
  "deliveryAddress": { "...": "..." },
  "deliveryForecastAt": "2028-12-31T18:00:00.000Z",
  "status": "PENDING",
  "items": [
    { "description": "Camiseta", "priceCents": 4990, "quantity": 2, "subtotalCents": 9980 },
    { "description": "Bermuda", "priceCents": 8990, "quantity": 1, "subtotalCents": 8990 }
  ],
  "totalCents": 18970,
  "createdAt": "2026-05-24T16:03:13.105Z",
  "updatedAt": "2026-05-24T16:03:13.105Z"
}
```

Se qualquer passo falhar (CPF inválido, forecast no passado, item com preço
negativo), o `AllExceptionsFilter` captura e devolve um erro estruturado:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid CPF",
    "requestId": "f4783486-e54b-4c9e-b1f5-c3d8779b133b"
  }
}
```

O `requestId` aparece em todos os logs daquela request — facilita rastrear o
caminho no log da app.

---

## Autenticação

O sistema usa **JWT em duas chaves**: um access curto (15 min) e um refresh
longo (7 dias). O refresh fica **hasheado** no banco com SHA-256 e é
**rotacionado** a cada uso.

| Endpoint                 | O que faz                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /v1/auth/sign-in`  | Recebe email/senha, valida com Argon2id, gera o par de tokens e salva o hash do refresh no banco                                                                                              |
| `POST /v1/auth/refresh`  | Recebe o refresh, valida assinatura + expiração, compara o hash com o do banco (timing-safe). Se bate, rotaciona o par. Se não bate, **revoga** o refresh do usuário (proteção contra replay) |
| `POST /v1/auth/sign-out` | Apaga o hash do refresh no banco — logout real                                                                                                                                                |

Rotas marcadas com `@Public()` (sign-in, refresh, health) ignoram o
`JwtAuthGuard` global. Todas as outras exigem `Authorization: Bearer <access>`.

---

## Persistência e soft delete

A app usa **PostgreSQL com Prisma 6**. O `PrismaService` aplica uma Client
Extension que injeta `where: { deletedAt: null }` em todas as queries de
leitura e update nos modelos `User` e `Order`. Isso significa que os use
cases tratam soft delete como se fosse hard delete — chamam
`order.softDelete()` e seguem em frente; o filtro de exclusão é
transparente.

Cada mudança de status do pedido (incluindo a criação) gera um registro em
`OrderStatusHistory` na **mesma transação** do save do pedido. Se um falhar,
o outro não persiste. O cliente pode anexar uma `statusNote` no PATCH para
contexto (ex: _"Cancelado a pedido do cliente"_).

---

## Número do pedido

A app cria uma sequence Postgres dedicada (`order_number_seq`) na migration
init. Cada novo pedido puxa `nextval` antes de existir, e o número final é
formatado como `ORD-2026-000123`. Atômico, sem race condition.

---

## Observabilidade e segurança

- **Logger Pino** (via `nestjs-pino`) — JSON estruturado em produção, pretty
  em dev. Cada request tem um `requestId` propagado em todos os logs. Campos
  sensíveis (`authorization`, `password`, `customerDocument`, tokens) são
  redacted automaticamente
- **Health checks** — `GET /health` (memória) e `GET /health/ready`
  (memória + ping no Postgres com timeout). O Render usa o readiness pra
  decidir se a app está pronta pra receber tráfego
- **Helmet** — headers HTTP de segurança (X-Frame-Options, CSP defaults, etc)
- **CORS** — whitelist por env; o app **bloqueia `*` em produção**
  via refinement no schema zod
- **Throttler** — 100 req/min por IP, ajustável por env
- **ValidationPipe global** — `whitelist: true` + `forbidNonWhitelisted:
true` rejeitam qualquer campo desconhecido no body, prevenindo mass
  assignment
- **Check constraints no Postgres** — defesa em profundidade: `priceCents >=
0`, `quantity >= 1`, `totalCents >= 0`, `deliveryForecastAt > createdAt`.
  Mesmo se um bug escapar do código, o banco recusa

---

## Migrations e seed

- Schema versionado em `prisma/migrations/` (commitado no repo)
- `npm run db:deploy` aplica em produção
- `npm run db:migrate` em desenvolvimento (cria nova migration se houver
  drift entre schema e DB)
- `npm run db:seed` cria 1 usuário admin (`admin@naporta.test` / `Admin@123`)
  e 50 pedidos aleatórios via `faker-js`. CPF/CNPJ gerados são válidos (com
  dígito verificador correto)
