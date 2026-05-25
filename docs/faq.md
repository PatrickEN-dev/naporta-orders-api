# FAQ — naPorta Orders API

Documento de tira-dúvidas técnicas. Use **Ctrl+F** com a palavra-chave que
precisar — as keywords estão indexadas no início de cada pergunta.

---

## Índice por tema

- [Configuração e variáveis de ambiente](#configuração-e-variáveis-de-ambiente)
- [Autenticação e segurança](#autenticação-e-segurança)
- [Domínio e regras de negócio](#domínio-e-regras-de-negócio)
- [HTTP, contratos e respostas](#http-contratos-e-respostas)
- [Bibliotecas — por que cada uma](#bibliotecas--por-que-cada-uma)
- [Banco de dados e persistência](#banco-de-dados-e-persistência)
- [Arquitetura e organização do código](#arquitetura-e-organização-do-código)
- [Operação, testes e deploy](#operação-testes-e-deploy)

## Índice de palavras-chave (Ctrl+F)

`NODE_ENV` · `PORT` · `LOG_LEVEL` · `DATABASE_URL` · `JWT_ACCESS_SECRET` ·
`JWT_REFRESH_SECRET` · `JWT_ACCESS_TTL` · `JWT_REFRESH_TTL` ·
`CORS_ORIGINS` · `RATE_LIMIT_TTL` · `RATE_LIMIT_MAX` · `TRUST_PROXY` ·
`MEMORY_HEAP_LIMIT_MB` · `DB_PING_TIMEOUT_MS` · `Argon2id` · `jti` ·
`refresh token` · `replay` · `mod-11` · `CPF` · `CNPJ` · `priceCents` ·
`totalCents` · `subtotalCents` · `IEEE 754` · `statusNote` · `PENDING` ·
`IN_TRANSIT` · `DELIVERED` · `CANCELED` · `soft delete` · `deletedAt` ·
`audit trail` · `OrderStatusHistory` · `400 vs 422` · `RFC 4918` ·
`requestId` · `mass assignment` · `whitelist` · `paginação` ·
`NestJS` · `Prisma` · `Postgres` · `Mongo` · `zod` · `class-validator` ·
`class-transformer` · `nestjs-pino` · `pino` · `Helmet` · `Throttler` ·
`Swagger` · `Passport` · `tsx` · `ts-node` · `Faker` · `Husky` ·
`commitlint` · `lint-staged` · `DDD` · `tactical DDD` · `Clean Architecture` ·
`Value Object` · `Aggregate Root` · `Repository` · `Use Case` · `seed` ·
`migrations` · `Jest` · `Supertest` · `Render` · `Neon` · `Docker multistage`

---

## Configuração e variáveis de ambiente

Todas as variáveis são validadas por **zod** no boot. Se uma estiver
inválida ou faltando, a aplicação não sobe — o erro aparece em
[src/config/env.schema.ts](../src/config/env.schema.ts).

### Por que `NODE_ENV=development` no `.env.example`? Não deveria ser `production`?

**Keywords:** `NODE_ENV`, `development`, `production`, `.env.example`

Está certo estar `development`. O `.env.example` é o **molde de boot
para desenvolvimento local** — alguém que clona o repo faz
`cp .env.example .env` e quer rodar em modo dev imediatamente.

Em produção (Render, Docker Compose, GitHub Actions, etc.) o
`NODE_ENV` vem do **ambiente da plataforma** e sobrescreve o que
estiver no `.env`. No `docker-compose.yml` está fixado como
`NODE_ENV: production`; no Render é definido no painel.

O `env.schema` ativa refinements (CORS não pode ser `*`, secrets
precisam ser diferentes) **somente quando `NODE_ENV=production`**.
Forçar `production` no `.env.example` quebraria a experiência dev sem
ganho de segurança.

### O que cada valor de `NODE_ENV` faz?

**Keywords:** `NODE_ENV`, `development`, `test`, `production`,
`enableImplicitConversion`, `pino-pretty`

- `development`: logs em `pino-pretty` (colorido, legível); CORS
  liberado; secrets podem ser iguais.
- `test`: usado pelos suites Jest; silencia logs e desabilita
  endpoints opcionais.
- `production`: logs em JSON puro (parseável por agregadores como
  Datadog, Loki); `CORS_ORIGINS=*` é rejeitado no boot; secrets
  iguais entre access e refresh são rejeitados.

### O que `PORT` controla?

**Keywords:** `PORT`, `listen`, `3000`

A porta HTTP em que a API escuta. Default `3000`. Em containers
você normalmente expõe `3000:3000`; no Render a plataforma injeta o
`PORT` automaticamente.

### Como o `LOG_LEVEL` muda o comportamento?

**Keywords:** `LOG_LEVEL`, `pino`, `fatal`, `error`, `warn`, `info`,
`debug`, `trace`, `nestjs-pino`

Valores aceitos: `fatal | error | warn | info | debug | trace`
(default `info`). Usa o sistema de níveis do **pino**, integrado via
**nestjs-pino**. Cada nível inclui os anteriores — `debug` mostra
debug + info + warn + error + fatal.

Em produção, mantenha `info`. Em dev, use `debug` se precisar ver
queries SQL ou payloads detalhados (com PII redacted automaticamente —
ver `src/infra/logger/`).

### O que precisa estar em `DATABASE_URL`?

**Keywords:** `DATABASE_URL`, `Postgres`, `Neon`, `connection string`,
`sslmode`, `pooler`

Connection string Postgres. Formato canônico:

```
postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

Para Neon (managed), use o endpoint **pooled** com `sslmode=require`:

```
postgresql://user:pwd@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
```

Para o Postgres do `docker-compose.yml`:

```
postgresql://naporta:naporta@localhost:5432/naporta?schema=public
```

### Por que dois secrets JWT (`JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`)?

**Keywords:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `HS256`,
`openssl rand`, `secret rotation`

Isolamento de blast radius. Se o secret do access vazar (por exemplo
via log), o atacante consegue forjar access tokens mas não consegue
forjar refresh tokens (que têm vida muito mais longa). Manter
secrets separados também permite **rotacionar um sem invalidar o
outro**.

Mínimo de **32 caracteres**, validado pelo zod. Gere com:

```bash
openssl rand -base64 48
```

Em produção, o schema rejeita os dois secrets iguais.

### O que `JWT_ACCESS_TTL` e `JWT_REFRESH_TTL` aceitam?

**Keywords:** `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `15m`, `7d`, `TTL`

Strings no formato `<número><unidade>` onde unidade é
`ms | s | m | h | d`. Defaults: `15m` (access) e `7d` (refresh). O
trade-off:

- Access curto = menor janela se vazar, mas mais refresh requests.
- Refresh longo = melhor UX (não força login a cada hora), mas
  janela maior se vazar (mitigado por rotation + jti).

### O que `CORS_ORIGINS` espera?

**Keywords:** `CORS_ORIGINS`, `CORS`, `Access-Control-Allow-Origin`

Lista separada por vírgulas dos hosts permitidos. Exemplo:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://app.naporta.com
```

Valor `*` é aceito em dev mas **rejeitado em produção** pelo
refinement do zod — é um erro comum esquecer e expor a API pra
qualquer origem.

### Quando preciso de `TRUST_PROXY=1`?

**Keywords:** `TRUST_PROXY`, `X-Forwarded-For`, `load balancer`,
`reverse proxy`, `rate limit por IP`

Quando a aplicação está atrás de um load balancer ou reverse proxy
(Render, Heroku, Nginx, Cloudflare). Sem isso, o `req.ip` que o
Throttler usa pra rate-limit acaba sendo o IP do proxy — todos os
clientes batem com o mesmo IP e o limite global cai sobre todo
mundo.

`TRUST_PROXY=1` diz pro Express confiar em **1 hop** de proxy à
frente. Aumente conforme o número de proxies entre o cliente e a
API. No Render, `1` é suficiente.

### Como funciona o rate-limit (`RATE_LIMIT_TTL` + `RATE_LIMIT_MAX`)?

**Keywords:** `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`, `Throttler`,
`@nestjs/throttler`, `X-RateLimit`

Janela deslizante por IP. Defaults: **100 requests por 60 segundos**.
Quando o limite estoura, a API responde **429 Too Many Requests** e
adiciona os headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 47   # segundos até resetar
```

Em produção, ajuste pra cima se for uma API interna sob alto
volume.

### O que `MEMORY_HEAP_LIMIT_MB` controla?

**Keywords:** `MEMORY_HEAP_LIMIT_MB`, `health check`,
`@nestjs/terminus`, `liveness`

Threshold do health check de memória heap (em MB). Se o heap
ultrapassar esse valor, `GET /health/ready` retorna status
`error` para a memória — útil pro Kubernetes ou Render reiniciar
o pod antes do OOM kill.

Default `256` MB. Para containers maiores, suba.

### Pra que serve `DB_PING_TIMEOUT_MS`?

**Keywords:** `DB_PING_TIMEOUT_MS`, `readiness`, `health/ready`,
`SELECT 1`

Timeout (ms) do `SELECT 1` que `GET /health/ready` faz contra o
Postgres pra confirmar conectividade. Default `2000`. Se o banco
não responder em 2s, retorna `database: down`.

Numa rede flaky (Neon free tier, primeiro cold start), 5000–8000
ms é razoável.

---

## Autenticação e segurança

### Por que a senha do sign-in precisa ter 8 caracteres? E por que senha errada às vezes retorna 400 em vez de 401?

**Keywords:** `password`, `MinLength`, `ValidationPipe`, `400 vs 401`,
`Argon2id`, `defesa em camadas`

A regra no DTO de sign-in é `@MinLength(8)`. Se o cliente manda
menos que 8 caracteres, o `ValidationPipe` rejeita **antes** de
chegar no service — daí `400 Bad Request` com mensagem em PT-BR.
Senha com 8+ caracteres mas incorreta passa pelo validator, vai
até o service, falha no `argon2.verify` e retorna `401
Unauthorized` com "credenciais inválidas".

É defesa em camadas: filtrar inputs absurdos na borda evita gastar
CPU em Argon2id pra palpites de 1 caractere. Argon2id é
intencionalmente caro (~100ms por verify). Trade-off: vaza o
requisito mínimo de 8 chars, que de qualquer forma está documentado
no Swagger.

### Por que Argon2id e não bcrypt?

**Keywords:** `Argon2id`, `bcrypt`, `password hashing`, `OWASP`,
`memory-hard`

Argon2id venceu o Password Hashing Competition em 2015 e é o
algoritmo recomendado atualmente pela **OWASP**. Frente ao bcrypt:

- **Memory-hard**: dificulta ataques com GPU/ASIC, que são baratos
  para bcrypt (CPU-bound).
- **Resistente a side-channel**: a variante `id` combina as
  resistências a timing attacks (`Argon2i`) com a robustez a GPU
  (`Argon2d`).
- **Tunável**: três parâmetros independentes (memória, paralelismo,
  iterações), enquanto bcrypt tem só um (`cost`).

Custo: ~100ms por hash com parâmetros default da lib `argon2`.

### Por que o JWT tem um `jti`?

**Keywords:** `jti`, `JWT`, `replay`, `randomUUID`, `iat`, `token único`

Sem `jti`, dois `issueTokens` no mesmo segundo geravam JWTs
byte-idênticos — porque o claim `iat` (issued-at) tem precisão de
segundos. Tokens iguais quebram a proteção contra replay: se você
guarda o hash do refresh antigo pra detectar reuso, um refresh
emitido no mesmo segundo do anterior é indistinguível.

Solução: adicionar `jti: randomUUID()` ao payload. Cada token vira
único independente do timestamp. Custo: 36 bytes a mais por token,
negligível.

### Como o refresh token rotaciona?

**Keywords:** `refresh token`, `rotation`, `SHA-256`, `auth_sessions`

Fluxo no `POST /v1/auth/refresh`:

1. Verifica assinatura do JWT recebido contra `JWT_REFRESH_SECRET`.
2. Calcula `SHA-256(refreshToken)` e busca em `auth_sessions`.
3. Se a sessão não existir ou já estiver revogada → `401`. (Sinal
   de replay: pode revogar **todas** as sessões do usuário.)
4. Se válida: emite novo par access + refresh, grava o hash do novo
   refresh, marca o antigo como `revoked`.

Resultado: cada refresh só pode ser usado **uma vez**. Tentativa
de reuso = 401 imediato.

### Por que o refresh fica como SHA-256 e não em texto puro?

**Keywords:** `SHA-256`, `hash`, `auth_sessions`, `vazamento de DB`

Mesma lógica de senhas: se o banco vaza, o atacante não consegue
usar diretamente os refresh tokens que estavam ativos. SHA-256 é
suficiente aqui (não é segredo de longo prazo nem precisa de slow
hash como Argon2) e tem busca O(1) por igualdade.

### Como funciona o sign-out?

**Keywords:** `sign-out`, `logout`, `revogação`

`POST /v1/auth/sign-out` marca todas as sessões do usuário como
revogadas em `auth_sessions`. O access token continua válido até
expirar (15 min default) — JWTs são stateless. Para revogar
acesso instantaneamente, precisaria de blacklist em Redis ou
similar (decisão consciente de não implementar pelo escopo do
teste).

---

## Domínio e regras de negócio

### Por que CPF aceita com máscara (`529.982.247-25`) E sem máscara (`52998224725`)?

**Keywords:** `CPF`, `máscara`, `replace`, `Document`,
`Value Object`, `normalização`

O `Document` value object faz `replace(/\D/g, '')` antes de
validar. Aceitar as duas formas é ergonomia para o cliente: o
mesmo front que envia "como digitado" funciona, e o front que
envia "limpo" também. No banco fica sempre só dígitos.

### Como funciona a validação CPF/CNPJ?

**Keywords:** `mod-11`, `dígito verificador`, `algoritmo`,
`CPF.validate`, `CNPJ.validate`

Algoritmo oficial **mod-11** sobre os dígitos verificadores. CPF
com 11 dígitos e DV correto passa; CPF com formato OK mas DV
errado (ex: `123.456.789-00`) é rejeitado. Casos especiais
tratados:

- Todos os dígitos iguais (`111.111.111-11`, `000.000.000-00`) →
  rejeitados (o algoritmo aceitaria, mas são CPFs notórios de
  teste).
- Comprimento diferente de 11 (CPF) ou 14 (CNPJ) → rejeitado
  antes do mod-11.

Implementação em [src/modules/orders/domain/value-objects/document.vo.ts](../src/modules/orders/domain/value-objects/document.vo.ts).

### Por que `priceCents` é inteiro em centavos e não `price: 49.90` em reais?

**Keywords:** `priceCents`, `int`, `float`, `IEEE 754`, `centavos`,
`Stripe`, `Mercado Pago`

Para evitar erros de ponto flutuante. JavaScript usa IEEE 754, então
`0.1 + 0.2 === 0.30000000000000004`. Em uma API que soma preços,
isso vira diferença de centavos no total — bug clássico de
e-commerce.

A solução padrão da indústria é armazenar **inteiros em centavos**:

- R$ 49,90 = `4990`
- R$ 1.599,00 = `159900`

Soma, multiplicação e armazenamento são todos exatos. Stripe,
Square, Mercado Pago e a maioria das APIs de pagamento seguem esse
padrão.

Alternativa seria `Decimal` (Prisma suporta), mas exige biblioteca
de big-decimal no cliente e perde simplicidade. Cents-as-int ganha.

### Por que `totalCents` vem na response? O frontend não consegue calcular?

**Keywords:** `totalCents`, `fonte da verdade`, `snapshot`,
`auditoria`

Três motivos:

1. **Fonte da verdade no backend.** Se o cálculo está em dois
   lugares, em algum momento divergem — alguém esquece de aplicar
   uma regra (desconto, frete, imposto). O backend é o único
   responsável pelo total.
2. **Garantia transacional.** O total é calculado dentro da mesma
   transação que persiste os itens. Se o cliente recebe
   `totalCents`, é exatamente o que está no banco.
3. **Auditoria / snapshot.** Se amanhã mudar a regra (adicionar
   frete), pedidos antigos continuam consistentes porque o valor
   está congelado.

O cliente pode (e deve) recalcular para validar, mas a referência é
sempre o `totalCents` que o servidor devolve.

### Para que serve `subtotalCents` no item?

**Keywords:** `subtotalCents`, `priceCents * quantity`

Valor pré-calculado de `priceCents × quantity`, devolvido em cada
item. Razão: facilitar o cliente exibir "R$ 49,90 × 2 = R$ 99,80"
sem precisar multiplicar. É derivado, não armazenado no banco —
calculado on-the-fly na response.

### Qual a máquina de estado dos status?

**Keywords:** `PENDING`, `IN_TRANSIT`, `DELIVERED`, `CANCELED`,
`máquina de estado`, `transition`

```
PENDING ──→ IN_TRANSIT ──→ DELIVERED  (terminal)
   │            │
   └────────────┴──→ CANCELED  (terminal)
```

Regras:

- `PENDING → DELIVERED` é proibido (pula etapa).
- `IN_TRANSIT → PENDING` é proibido (não volta).
- `DELIVERED` e `CANCELED` são terminais — não saem de lá.
- Qualquer status **não-terminal** pode ir para `CANCELED`.

Tentar uma transição inválida retorna `422 Unprocessable Entity` com
`code: INVALID_STATE`.

### Para que serve `statusNote`?

**Keywords:** `statusNote`, `notes`, `audit trail`, `OrderStatusHistory`

Campo opcional no `PATCH /v1/orders/:id`. Quando o `status` muda, a
nota é gravada na linha de `order_status_history` (coluna `notes`).
Casos típicos: "Cliente solicitou cancelamento", "Endereço
não-localizado, devolvido ao CD", "Saiu para entrega 14h30".

Sem mudança de status no PATCH, o `statusNote` é ignorado (não
registra linha de histórico).

### O que dá pra editar via PATCH? E por que `customerName` não?

**Keywords:** `PATCH`, `whitelist`, `mass assignment`, `imutável`,
`snapshot`

O DTO de update é uma whitelist. Campos não listados são rejeitados
(`400` com `property X should not exist`).

**Editáveis:** `status`, `deliveryAddress`, `deliveryForecastAt`,
`items` (substitui o array; `totalCents` é recalculado),
`statusNote`.

**Imutáveis:**

- `id`, `number`, `createdAt`, `updatedAt`, `totalCents` —
  gerenciados pelo servidor.
- `customerName`, `customerDocument` — o cliente é um snapshot do
  pedido. Mudar o nome do cliente em um pedido já criado é fraude
  no domínio de e-commerce/logística — se errou, cancela e refaz.

### O que é o soft delete e como inspecionar?

**Keywords:** `soft delete`, `deletedAt`, `Client Extension`, `Prisma`

`DELETE /v1/orders/:id` não apaga a linha — preenche `deletedAt`
com `now()`. Uma **Prisma Client Extension** (`withSoftDelete`)
injeta `WHERE deletedAt IS NULL` em todas as queries de read e
update, então a linha vira invisível pra API.

Para inspecionar (via Adminer em `localhost:8080` ou `psql`):

```sql
SELECT id, number, status, "deletedAt"
FROM orders
WHERE "deletedAt" IS NOT NULL;
```

### Como funciona o audit trail (`OrderStatusHistory`)?

**Keywords:** `audit trail`, `order_status_history`, `fromStatus`,
`toStatus`, `notes`, `changedById`

Tabela `order_status_history`. Cada vez que `status` muda (incluindo
a criação do pedido, com `fromStatus: null → toStatus: PENDING`),
uma linha é gravada com:

- `fromStatus` (nullable, só pra criação)
- `toStatus`
- `notes` (do `statusNote` do PATCH)
- `changedById` (FK pra `users.id`)
- `changedAt`

**Não é exposto via HTTP por padrão.** Inspeção via Adminer/Prisma
Studio. Expor via `GET /v1/orders/:id/history` é um próximo passo
natural.

---

## HTTP, contratos e respostas

### Por que transição de status inválida retorna `422` e não `400`?

**Keywords:** `400 vs 422`, `RFC 4918`, `Unprocessable Entity`,
`Bad Request`, `INVALID_STATE`

- `400 Bad Request` = input malformado: JSON quebrado, tipo errado,
  campo obrigatório ausente.
- `422 Unprocessable Entity` ([RFC 4918 §11.2](https://datatracker.ietf.org/doc/html/rfc4918#section-11.2))
  = input sintaticamente correto mas viola regra de negócio.

Caso clássico: `PATCH {"status":"DELIVERED"}` num pedido que está
`PENDING`. JSON válido, enum válido, recurso existe — mas o estado
atual proíbe a transição. Isso é 422.

### Qual o formato padronizado de erro?

**Keywords:** `error format`, `code`, `message`, `details`,
`requestId`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CPF inválido",
    "details": ["..."],
    "requestId": "b5090a45-4ec9-456f-b234-8bfa1cf6f4ec"
  }
}
```

- `code`: enum interno (`VALIDATION_ERROR`, `BAD_REQUEST`,
  `UNAUTHORIZED`, `NOT_FOUND`, `INVALID_STATE`, `INTERNAL_ERROR`).
- `message`: descrição humana (em PT-BR para erros de domínio).
- `details`: array opcional com múltiplos erros (usado pelo
  class-validator quando vários campos falham).
- `requestId`: UUID gerado por request, presente também nos logs
  estruturados. Cliente reporta o `requestId` em um suporte e o time
  acha o trace exato no agregador.

### Como o `requestId` funciona?

**Keywords:** `requestId`, `correlation id`, `nestjs-pino`,
`X-Request-Id`

Cada request HTTP recebe um UUID v4 no middleware do nestjs-pino. O
mesmo ID aparece em:

- Header de resposta `X-Request-Id`
- Cada log line gerada durante o processamento
- O `requestId` dentro do body de erro

Útil para suporte ("manda o requestId da sua tentativa") e debugging
distribuído.

### Como funciona a paginação?

**Keywords:** `paginação`, `page`, `limit`, `data`, `meta`,
`totalPages`

Toda listagem devolve:

```json
{
  "data": [
    /* itens */
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 51,
    "totalPages": 3
  }
}
```

`page` >= 1 (default 1), `limit` 1..100 (default 20). O envelope
`{data, meta}` permite adicionar metadados (cursores, links HATEOAS,
agregações) sem quebrar contrato.

### Que filtros a listagem aceita?

**Keywords:** `filtros`, `number`, `startDate`, `endDate`, `status`,
`sort`

```
GET /v1/orders?number=ORD-2026-000123
              &startDate=2026-01-01T00:00:00.000Z
              &endDate=2026-05-31T23:59:59.999Z
              &status=PENDING
              &sort=-createdAt
              &page=1&limit=20
```

- `number`: match exato.
- `startDate` / `endDate`: intervalo em `createdAt`, ambos
  opcionais e combinam com `AND`.
- `status`: enum.
- `sort`: `createdAt` ou `deliveryForecastAt`. Prefixo `-` =
  descendente. Default: `-createdAt`.

### O que é mass-assignment e como vocês previnem?

**Keywords:** `mass assignment`, `whitelist`, `forbidNonWhitelisted`,
`ValidationPipe`

Mass-assignment = cliente manda um campo que ele não deveria poder
controlar e o backend atualiza no banco (ex: `PATCH {"id": "...",
"role": "admin"}` virando privilege escalation).

O `ValidationPipe` global está configurado com:

```ts
new ValidationPipe({
  whitelist: true, // remove propriedades não-decoradas
  forbidNonWhitelisted: true, // mais: rejeita com 400
  transform: true,
});
```

Resultado: campos não listados no DTO viram `400 Bad Request` com
mensagem "property X should not exist".

---

## Bibliotecas — por que cada uma

### Por que NestJS e não Express puro ou Fastify?

**Keywords:** `NestJS`, `Express`, `Fastify`, `DI`, `decorators`,
`módulos`

NestJS dá **DI container, módulos, decorators e padrões**
opinativos. Para uma API de domínio com auth, validação, swagger,
rate-limit, health checks e logs estruturados, o ganho é
significativo:

- Módulos isolam features (auth, orders, health) sem boilerplate.
- DI permite trocar implementações em testes (mock repository,
  fake clock) sem hack global.
- Decorators (`@Module`, `@Injectable`, `@Controller`) deixam o
  fluxo HTTP explícito.
- Ecossistema oficial cobre tudo que esse projeto usa: `@nestjs/jwt`,
  `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/swagger`,
  `@nestjs/terminus`, `@nestjs/config`.

Express puro daria mais trabalho de setup; Fastify seria mais
performático em throughput puro mas com menor cobertura de
ecossistema para o escopo.

### Por que NestJS e não Go (Gin, Echo, Fiber)?

**Keywords:** `NestJS`, `Go`, `Gin`, `Echo`, `TypeScript`

A escolha foi por **TypeScript com NestJS** por três motivos:

1. **Domínio compartilhado com o frontend.** Em times full-stack
   TS, value objects e DTOs podem ser compartilhados (ou ao menos
   espelhados sem fricção). Em Go isso é uma fronteira.
2. **Ecossistema de validação e ORM maduros** — Prisma, zod,
   class-validator entregam o mesmo nível de robustez de Go com
   menos código.
3. **Velocidade de implementação.** Para o escopo desse teste
   (auth, CRUD, validação, swagger, testes, deploy), Node + Nest
   entrega em ~10-15h o que Go entregaria em 20-25h — sem perda
   real de performance pra um workload majoritariamente I/O bound
   (Postgres).

Em workloads CPU-intensivos ou high-concurrency real (10k+ rps),
Go ganharia. Não é o caso aqui.

### Por que Postgres e não MongoDB?

**Keywords:** `Postgres`, `Mongo`, `relacional`, `ACID`, `Prisma`

O domínio é **relacional por natureza**: pedido tem N itens, tem
um cliente, tem um histórico de mudanças de status. Joins,
constraints (FK, CHECK) e transações ACID são valor direto.

Mongo seria adequado se o "pedido" fosse um documento opaco e
não houvesse necessidade de consultar partes (itens por SKU,
agregações cross-pedidos). Não é o caso.

Bonus: `OrderNumber` usa uma **sequence Postgres** (`SELECT
nextval`) que garante numeração estritamente crescente sem race
condition mesmo com 1000 inserts concorrentes. Mongo precisaria de
findAndModify + counter doc, com semântica mais frouxa.

### Por que Prisma e não TypeORM ou Sequelize?

**Keywords:** `Prisma`, `TypeORM`, `Sequelize`, `migrations`,
`schema-first`

Prisma é **schema-first** (`prisma/schema.prisma` é a fonte da
verdade), gera client tipado por código, e tem migrations
declarativas com `migrate dev` e `migrate deploy`.

Frente a TypeORM:

- Tipos do client são **inferidos do schema**, não declarados em
  decorators que podem divergir do banco.
- Migrations são SQL versionadas + arquivo de schema, não
  metaprogramação.
- Menos pegadinhas de eager/lazy loading.

Trade-off: Prisma é menos flexível para queries muito dinâmicas
(você cai em `$queryRaw`). Para o escopo desse projeto, ganha.

### Por que zod para env mas class-validator para HTTP?

**Keywords:** `zod`, `class-validator`, `validação`, `DTO`,
`env.schema`

Razões diferentes:

- **zod** brilha em validação programática com **refinements**
  (`NODE_ENV=production` ⇒ `CORS_ORIGINS != "*"`). Schema é uma
  expressão pura, ideal para validar `process.env` no boot.
- **class-validator** + **class-transformer** são o padrão do
  NestJS para DTOs HTTP. Integram com o `ValidationPipe`,
  `@nestjs/swagger` gera spec OpenAPI direto dos decorators, e
  `transform` aplica coerções (string→Date, string→number) sem
  boilerplate.

Usar zod nos DTOs HTTP daria duplicação (sem ganho real); usar
class-validator no env perderia os refinements ergonômicos.

### Por que nestjs-pino e não Winston?

**Keywords:** `nestjs-pino`, `pino`, `Winston`, `JSON logs`,
`structured logs`

Pino é o logger Node mais rápido (~5× Winston) e produz JSON
estruturado por padrão. JSON estruturado é o formato que
agregadores (Datadog, Loki, Cloudwatch) querem.

`nestjs-pino` integra automaticamente:

- `requestId` injetado em todo log da request
- Middleware HTTP que loga método, rota, status, latência
- Redação de campos sensíveis (`password`, `token`, `authorization`)

Em dev, `pino-pretty` formata o JSON colorido pra terminal. Em
prod, sai JSON puro pro stdout.

### Por que Helmet?

**Keywords:** `Helmet`, `headers`, `CSP`, `HSTS`, `XSS`, `MIME sniffing`

Conjunto de middlewares que setam headers HTTP defensivos por
default:

- **CSP** (`Content-Security-Policy`) restringe origens de scripts
  e estilos.
- **HSTS** (`Strict-Transport-Security`) força HTTPS em browsers.
- **X-Content-Type-Options: nosniff** evita MIME sniffing.
- **X-Frame-Options: SAMEORIGIN** previne clickjacking.
- **Referrer-Policy: no-referrer** evita vazamento de URL.

Custo zero, ganho de defesa em profundidade. Padrão de qualquer
API Express/Nest em produção.

### Por que `@nestjs/throttler`?

**Keywords:** `Throttler`, `rate limit`, `429`, `brute force`

Rate-limit global por IP — mitiga brute force em sign-in (você
não consegue chutar 1000 senhas em 60s) e abusos genéricos
(scraping, DoS amador).

Integra como guard global no `AppModule`, com `RATE_LIMIT_TTL` e
`RATE_LIMIT_MAX` vindos do env.

### Por que Swagger / OpenAPI?

**Keywords:** `Swagger`, `OpenAPI`, `@nestjs/swagger`, `/docs`,
`docs-json`

Documentação **interativa** e **executável** sem ferramenta extra.
O recrutador abre `/docs`, clica em "Try it out", autentica e roda
qualquer endpoint direto do browser.

Bonus: `/docs-json` exporta o spec OpenAPI 3.0 que ferramentas
externas (Postman import, code generators, contract testing)
consomem.

### Por que Passport com `passport-jwt`?

**Keywords:** `Passport`, `passport-jwt`, `JwtStrategy`,
`AuthGuard('jwt')`

Padrão maduro do ecossistema Node. Integra com `@nestjs/passport`
e dá `AuthGuard('jwt')` que decora controllers sem código de
validação manual em cada handler.

Alternativa seria validar o JWT inline — equivalente em
funcionalidade, mais boilerplate.

### Por que tsx no seed (e não ts-node)?

**Keywords:** `tsx`, `ts-node`, `seed`, `TypeScript runtime`

`tsx` é mais leve que `ts-node` (compila com esbuild, ~10× mais
rápido), tem zero configuração e usa o mesmo `tsconfig.json`.
Movido pra `dependencies` (não devDeps) porque o
`docker-compose.yml` roda `db:seed` dentro do container de
produção depois do `npm prune --production`.

### Por que `@faker-js/faker`?

**Keywords:** `Faker`, `seed`, `dados realistas`, `pt-BR`

Gerador de dados fictícios com locale `pt-BR` para nomes, endereços
e telefones brasileiros. O seed combina o Faker com listas
curadas (17 cidades reais com estados corretos, 19 bairros
conhecidos, 20 produtos plausíveis) para gerar 50 pedidos que
parecem reais quando o recrutador lista.

Em `dependencies` (não devDeps) pelo mesmo motivo do tsx — o
seed roda no container de produção.

### Para que servem Husky, commitlint e lint-staged?

**Keywords:** `Husky`, `commitlint`, `lint-staged`, `pre-commit`,
`Conventional Commits`

- **Husky**: instala hooks git no `npm install`.
- **lint-staged**: roda ESLint + Prettier apenas nos arquivos
  staged no `pre-commit`. Não revalida o repo inteiro.
- **commitlint**: valida que a mensagem segue Conventional Commits
  (`feat:`, `fix:`, `chore:`, etc) no `commit-msg`.

Resultado: o repo só aceita commits com lint OK e mensagem padrão,
sem depender da disciplina manual do dev.

---

## Banco de dados e persistência

### Como `OrderNumber` é gerado sem race condition?

**Keywords:** `OrderNumber`, `sequence`, `nextval`, `race condition`,
`ORD-YYYY-NNNNNN`

`prisma/schema.prisma` declara uma **Postgres SEQUENCE** dedicada:

```sql
CREATE SEQUENCE order_number_seq START 1;
```

Na criação do pedido, o serviço faz `SELECT nextval('order_number_seq')`
dentro da transação. A sequence é **atômica em nível de DB** — mesmo
com 100 inserts concorrentes, cada um pega um número único e
estritamente crescente.

O resultado é formatado como `ORD-${year}-${seq.padStart(6, '0')}`,
ex: `ORD-2026-000051`.

### Por que separar `OrderItem` em tabela em vez de JSONB no `Order`?

**Keywords:** `OrderItem`, `JSONB`, `relacional`, `índice`,
`agregação`

JSONB seria atraente porque o item "pertence" ao pedido. Mas como
tabela, os itens podem ser:

- **Indexados** por `description` para consultas tipo "todos os
  pedidos que contêm produto X".
- **Agregados** por preço médio, quantidade total etc. sem
  unnest.
- **Constrained** com FK + CHECK no nível do banco.

JSONB seria adequado se os itens fossem **opacos** (objetos
genéricos sem schema fixo). Não é o caso.

### O que são as `CHECK constraints` no Postgres?

**Keywords:** `CHECK constraint`, `defesa em profundidade`,
`priceCents >= 0`

Defesa em profundidade. Mesmo que um bug ou query manual tente
inserir um `priceCents` negativo ou `quantity = 0`, o banco rejeita
com erro. Migrações em [prisma/migrations/](../prisma/migrations/)
têm:

```sql
ALTER TABLE order_items
  ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0);

ALTER TABLE order_items
  ADD CONSTRAINT order_items_price_check CHECK ("priceCents" >= 0);
```

A camada de domínio também valida, mas o banco é a última linha de
defesa.

### O que está no `prisma/seed.ts`?

**Keywords:** `seed`, `db:seed`, `Argon2`, `Faker`

1. Apaga e recria usuário admin (`admin@naporta.test` / `Admin@123`,
   hash Argon2id).
2. Gera **50 pedidos** com Faker pt-BR:
   - Nomes brasileiros plausíveis
   - CPFs gerados com DV correto (mod-11)
   - Endereços de 17 cidades reais
   - 1-5 itens por pedido tirados de um catálogo curado de 20
     produtos
   - Status distribuído (30% PENDING, 30% IN_TRANSIT, 25%
     DELIVERED, 15% CANCELED)
   - `deliveryForecastAt` espalhado no futuro próximo

Idempotente: rodar `db:seed` duas vezes não duplica admin (procura
por email).

---

## Arquitetura e organização do código

Ver detalhes em [docs/architecture.md](./architecture.md) e
[docs/structure.md](./structure.md).

### O que é DDD tático? Por que não Clean Architecture?

**Keywords:** `DDD`, `tactical DDD`, `Clean Architecture`,
`Hexagonal`, `tradução literal`

**DDD tático** = uso de **entidades, value objects, aggregate
roots, repositories e use cases** dentro do escopo de um módulo,
sem subir a estratégia (bounded contexts, context mapping, event
storming).

Para o escopo do projeto (1 bounded context: Orders), DDD tático
entrega:

- Domínio expressivo (`Order`, `OrderItem`, `Address`, `Document`,
  `Money` como tipos próprios)
- Invariantes próximas das regras (`Order.changeStatus` valida a
  máquina de estado)
- Persistência isolada atrás de `OrderRepository` (port + adapter)

Clean Architecture pura adicionaria camadas extras (Application,
Interfaces, Frameworks) que se traduziriam em ~30% mais arquivos
sem ganho prático aqui. Trade-off explícito.

### O que é Value Object?

**Keywords:** `Value Object`, `VO`, `imutável`, `identidade`,
`Money`, `Document`, `OrderNumber`

Objeto definido pelo **valor**, não pela identidade. Dois `Money`
de R$ 49,90 são iguais; dois `Order` com mesmo conteúdo mas IDs
diferentes não são.

VOs no projeto:

- `Money` — int em centavos
- `Document` — CPF ou CNPJ validado e normalizado
- `OrderNumber` — `ORD-YYYY-NNNNNN`
- `Address` — endereço completo
- `OrderStatus` — enum semântico

Imutáveis: para mudar, cria um novo. Garante que invariantes não
quebrem por mutação acidental.

### O que é Aggregate Root?

**Keywords:** `Aggregate Root`, `Order`, `OrderItem`, `invariante`

`Order` é o aggregate root: nenhum `OrderItem` é criado, alterado
ou deletado **fora do contexto de um pedido**. Toda mutação passa
por métodos do `Order` (`addItem`, `changeStatus`, etc), que
garantem invariantes (total recalculado, status válido, etc).

Repository persiste a aggregate como **unidade** — `OrderRepository.save`
grava o pedido e seus itens em uma transação.

### Como funcionam os Use Cases?

**Keywords:** `Use Case`, `application service`, `CreateOrder`,
`UpdateOrder`

Cada operação do domínio é um use case em
`src/modules/orders/application/use-cases/`. Padrão:

```ts
class CreateOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}
  execute(input: CreateOrderInput): Promise<Order> {
    /* validação de domínio + persistência transacional */
  }
}
```

Controllers HTTP são finos — recebem DTO, chamam o use case,
serializam a response.

### Por que Repository pattern? Não estou usando Prisma direto?

**Keywords:** `Repository`, `port and adapter`, `Prisma`, `desacoplamento`

Use cases dependem da **interface** `OrderRepository`, não do
`PrismaClient`. A implementação concreta (`PrismaOrderRepository`)
fica em `infra/persistence/`.

Ganhos:

- Testes unitários dos use cases usam **InMemoryOrderRepository**
  sem subir banco.
- Trocar Prisma por outro ORM no futuro toca só a infra.
- O domínio fala em `Order`, não em `prisma.order` (linguagem do
  negócio, não do framework).

Trade-off: ~20% mais código. Para o escopo, vale.

---

## Operação, testes e deploy

### Por que preciso rodar `npm run db:seed`?

**Keywords:** `seed`, `db:seed`, `admin user`, `dados de teste`

O banco sobe vazio. O seed cria o usuário admin (`admin@naporta.test`
/ `Admin@123`) e popula 50 pedidos fictícios para você ter dados
realistas pra testar listagem, filtros e paginação. Sem o seed, o
login falha (admin não existe).

### Como rodar as migrations?

**Keywords:** `migrations`, `prisma migrate`, `db:migrate`,
`db:deploy`

- **Dev**: `npm run db:migrate` (`prisma migrate dev`) — cria
  novas migrations a partir do `schema.prisma` e aplica.
- **Produção / CI**: `npm run db:deploy` (`prisma migrate deploy`) —
  só aplica migrations existentes, sem gerar novas.

### Como rodar os testes?

**Keywords:** `Jest`, `Supertest`, `npm test`, `test:cov`, `test:e2e`

- `npm test` — 53 testes unitários em 12 suites
- `npm run test:cov` — cobertura
- `npm run test:e2e` — end-to-end (Supertest contra app booted)

Cobertura prioritária: value objects (algoritmo CPF/CNPJ, máquina
de estado, money math), use cases.

### Como funciona o CI no GitHub Actions?

**Keywords:** `CI`, `GitHub Actions`, `lint`, `typecheck`, `docker build`

`.github/workflows/ci.yml` roda em todo push:

1. Install (`npm ci`)
2. Lint (`npm run lint:check`)
3. Format (`npm run format:check`)
4. Typecheck (`tsc --noEmit`)
5. Testes (`npm test`)
6. Build (`npm run build`)
7. Docker build (valida que o multistage funciona)

Se qualquer step falha, o PR fica vermelho.

### Como é o Dockerfile multistage?

**Keywords:** `Docker multistage`, `Dockerfile`, `deps`, `build`,
`runtime`, `node:22-alpine`

Três estágios:

1. **deps** — instala deps de produção apenas (`npm ci
--omit=dev`).
2. **build** — instala deps de dev, roda `npm run build`, gera
   `dist/`.
3. **runtime** — `node:22-alpine`, copia `node_modules` do deps e
   `dist` do build, roda como usuário não-root, `CMD ["node",
"dist/main.js"]`.

Imagem final ~150 MB. Não inclui ferramentas de build, não roda
como root.

### Por que Render e Neon (free tier)?

**Keywords:** `Render`, `Neon`, `free tier`, `cold start`, `deploy`

Free tier suficiente pra demonstrar o deploy ponta-a-ponta sem
gastar.

- **Render** hospeda a API. Free tier dorme após 15 min sem
  request; primeira request depois disso leva ~30s (cold start).
- **Neon** hospeda o Postgres. Pool deconnections geridas por eles
  (importante: usar o endpoint `-pooler` na connection string).

Para produção real, qualquer cloud paga: Render paid, Fly.io,
Railway, AWS, GCP. O `Dockerfile` é genérico.

### O que o `docker compose down -v` faz?

**Keywords:** `docker compose`, `down`, `-v`, `volume`, `reset`

Derruba todos os containers do `docker-compose.yml` E apaga o
volume `postgres-data` (o `-v`). Útil pra começar do zero — depois
de subir de novo, o banco está vazio e precisa de migrate + seed.

Sem `-v`, o volume persiste; ao subir de novo, os dados continuam.
