# Por que o projeto foi construído desta forma

Decisões com motivo e contrapeso. Cada escolha cita a alternativa que foi
descartada e o cenário em que faria sentido revisitar.

Para o **como funciona**, veja [`overview.md`](./overview.md). Para **onde
está cada coisa**, veja [`structure.md`](./structure.md).

---

## Stack

| Camada                | Escolha           | Motivo                                                                                       |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Framework             | NestJS 11         | Preferência explícita do desafio. DI nativa, modular, ecossistema maduro                     |
| Banco                 | PostgreSQL 16     | Preferência explícita do desafio. Dados são relacionais (pedido → itens, pedido → histórico) |
| ORM                   | Prisma 6          | Type-safety end-to-end, migrations versionadas, melhor DX do ecossistema Node                |
| Hash de senha         | Argon2id          | Vencedor do PHC. Substitui bcrypt em produção moderna                                        |
| Hash de refresh token | SHA-256           | Token de alta entropia não precisa de KDF caro                                               |
| Validação de payload  | class-validator   | Integração nativa Nest, decorators legíveis                                                  |
| Validação de env      | zod               | Schema declarativo, fail-fast no boot                                                        |
| Logger                | nestjs-pino       | JSON estruturado, o mais rápido do ecossistema Node                                          |
| Docs da API           | Swagger / OpenAPI | Auto-gerado por decorators, o avaliador testa sem ler código                                 |
| Testes                | Jest + Supertest  | Padrão de mercado                                                                            |
| Container             | Docker multistage | Imagem enxuta, non-root, paridade dev/prod                                                   |
| CI                    | GitHub Actions    | Free, integrado ao repo                                                                      |

---

## Arquitetura: DDD tático leve + SOLID

O domínio é **independente de framework**. NestJS, Prisma, Express, JWT são
detalhes técnicos que vivem fora de `domain/`. Isso não é dogma: é o que
permite trocar Prisma por outro ORM sem reescrever regras de negócio, e
testar use cases com fakes in-memory sem subir Nest.

Os padrões DDD usados (Entity, Value Object, Aggregate Root, Repository,
Use Case, Domain Event) e onde cada um mora estão detalhados em
[`structure.md`](./structure.md#srcmodules--domínios-de-negócio). Aqui
foco no **por quê** de cada decisão de design, não em **onde** ela está.

### Princípios SOLID na prática

- **S** Single Responsibility — `CreateOrderUseCase` só cria. Controller só
  traduz HTTP↔use-case. Mapper só converte. Cada arquivo tem um motivo único
  para mudar
- **O** Open/Closed — novo filtro? Acrescenta campo em `OrderFilters`. Use
  case não muda. Novo status? Adiciona no VO `OrderStatus`; a máquina de
  transições continua íntegra
- **L** Liskov — qualquer `OrderRepository` (Prisma em prod, in-memory nos
  testes) é plugável sem quebrar use cases
- **I** Interface Segregation — `OrderRepository` expõe só métodos de pedido.
  Sem god-interface
- **D** Dependency Inversion — use cases dependem de **abstrações do
  domínio**, não de classes de infra. Wiring em `*.module.ts`

---

## Decisões-chave de modelagem

### Cliente e endereço embarcados no pedido (snapshot)

O desafio lista cliente e endereço como **campos** do pedido, não entidades:

> _"Dados do pedido: ... Cliente (nome e documento), Endereço de entrega, ..."_

**Alternativa considerada:** tabelas `Customer` e `Address` próprias, com
FKs no `Order`.
**Escolhi snapshot porque:**

- O desafio descreve cliente como campo, não como entidade
- Snapshot dá consistência histórica: se o cliente mudar de endereço amanhã,
  o pedido entregue ontem mantém o endereço de quando foi feito
- Remove um módulo inteiro (`Customer` controller, repo, service, DTOs)

**Quando mudaria:** se o sistema precisar reportar _"quantos pedidos esse
CPF já fez?"_ ou de-duplicar clientes. Faria tabela `Customer` mantendo o
snapshot no `Order` (melhor dos dois mundos).

### Dinheiro em centavos (`Int`)

`priceCents`, `subtotal.cents`, `totalCents` — nunca `Float`.

**Alternativa considerada:** `Decimal` do Postgres ou `string` formatada.
**Escolhi `Int` porque:** elimina classe inteira de bugs de arredondamento;
operações aritméticas com inteiros são triviais e baratas.

**Quando mudaria:** se a moeda passasse a ter unidade fracionária menor
(ex: cripto com 18 decimais) ou se houvesse cálculos compostos complexos.

### Soft delete via Prisma Client Extension

**Alternativa considerada:** middleware Prisma (deprecado em v5) ou filtro
manual em cada query.
**Escolhi Client Extension porque:**

- É a API atual e suportada (substitui o middleware)
- Centraliza o filtro num lugar só — use cases ignoram o detalhe
- Cobre `findUnique/findFirst/findMany/count/update/updateMany` automaticamente

**Quando mudaria:** se precisássemos de queries que enxergam registros
deletados (restore, auditoria histórica). Hoje exporia um `prisma.base`
para esse uso.

### `OrderStatusHistory` na mesma transação do save

Quando o repositório salva um pedido, ele itera nos `pullEvents()` do
aggregate e insere o registro de história **dentro da mesma
`$transaction`**.

**Alternativa considerada:** event emitter (`@nestjs/event-emitter`) com
listener separado que grava o histórico depois.
**Escolhi transação porque:**

- Garante atomicidade: pedido sem histórico nunca acontece
- Não precisa de outbox/retry para erros do listener
- Simplifica testes (sem mock de event emitter)

**Quando mudaria:** se o histórico fosse despachado pra outro serviço
(notificação, BI). Aí faria padrão outbox + processo separado.

### JWT access curto + refresh rotacionado e hasheado

- Access: **15 min** (janela curta de ataque)
- Refresh: **7 dias**, **rotacionado a cada uso**, **hasheado em SHA-256** no banco
- Replay detectado → revoga refresh do usuário

**Alternativa considerada:** session-cookie tradicional ou OAuth via provedor.
**Escolhi JWT bearer porque:** o desafio exige bearer JWT explicitamente.

**Quando mudaria:** se precisasse de logout instantâneo em multi-device
(hoje cada user tem 1 refresh; outro login invalida o anterior). Solução:
tabela `RefreshSession` com várias sessões ativas.

### Geração do número via sequence Postgres

`CREATE SEQUENCE order_number_seq START 1` na migration init. Cada pedido
puxa `nextval` antes de existir.

**Alternativa considerada:** UUID como número (legível mas feio), contador
em tabela com `SELECT ... FOR UPDATE` (lock manual), Snowflake ID.
**Escolhi sequence porque:** atômica, sem coordenação na app, número
sequencial bonito (`ORD-2026-000123`) que o avaliador identifica fácil.

**Quando mudaria:** se houvesse sharding por região ou requisito de números
não-monotônicos (privacidade, evitar enumeração).

### Check constraints no Postgres

```sql
CHECK ("priceCents" >= 0)
CHECK ("quantity" >= 1)
CHECK ("totalCents" >= 0)
CHECK ("deliveryForecastAt" > "createdAt")
```

**Alternativa considerada:** confiar só na validação da app.
**Escolhi check constraints porque:** se um bug futuro escapar do código,
o banco recusa. Defesa em profundidade.

**Quando manteria mesmo migrando:** sempre.

---

## Padrões que ficaram de fora

| Padrão                      | Motivo                                                  |
| --------------------------- | ------------------------------------------------------- |
| Bounded Contexts separados  | Contexto único — não compensa                           |
| CQRS                        | Leitura e escrita do mesmo modelo                       |
| Event Sourcing              | Não reconstruímos estado a partir de eventos            |
| Mensageria (Kafka/RabbitMQ) | Eventos in-process resolvem                             |
| Microserviços               | Monolito modular cobre o desafio com mais clareza       |
| AutoMapper / mapping libs   | Mappers manuais são mais legíveis e o domínio fica puro |

---

## Trade-offs aceitos

| Decisão                                                  | Trade-off                                      | Quando reconsideraria                                    |
| -------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `UpdateOrderUseCase.replaceItems()` apaga e recria items | IDs antigos são perdidos                       | Se algo passar a referenciar `OrderItem.id` externamente |
| 1 refresh hash por usuário (single session)              | Login em outro dispositivo invalida o anterior | Multi-device exigiria tabela `RefreshSession`            |
| Sem endpoint de criação de usuário                       | Apenas seed cria                               | Se o desafio expandisse para registro público            |
| `OrderPresenter` manual (sem class-transformer)          | Mais código de mapeamento                      | Se o número de DTOs de saída explodisse (5+ formatos)    |
| Cliente embarcado (sem tabela)                           | Sem reuso/de-duplicação                        | Quando precisássemos consultar por cliente               |
| Sequence única (não por ano)                             | Numeração não reseta em 1º de janeiro          | Se houver requisito explícito de "reset anual"           |

---

## O que **não** está no projeto (e por quê)

- **Roles/RBAC** — desafio não pede; um único admin via seed
- **Endpoint pra histórico de status** — `OrderStatusHistory` é persistido
  mas não exposto. Pedido pelo desafio é só "editar pedido"
- **Endpoint pra restaurar pedido deletado** — não está nos requisitos
- **Cache de leitura (Redis)** — não há volume que justifique
- **Upload de arquivos** — não é requisito
- **i18n** — escopo PT-BR
- **Multi-tenant** — single tenant
- **GraphQL** — desafio pede REST

Cada omissão é uma decisão consciente. Mostrar o que **não** foi feito é
tão importante quanto mostrar o que foi.
