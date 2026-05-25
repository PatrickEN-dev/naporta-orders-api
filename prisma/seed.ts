import { fakerPT_BR as faker } from '@faker-js/faker';
import { type OrderStatus, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const ADMIN_EMAIL = 'admin@naporta.test';
const ADMIN_PASSWORD = 'Admin@123';
const ORDERS_TO_SEED = 50;

const STATUSES: OrderStatus[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELED'];

const BRAZILIAN_CITIES: Array<{ city: string; state: string }> = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Santos', state: 'SP' },
  { city: 'São Bernardo do Campo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Niterói', state: 'RJ' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Uberlândia', state: 'MG' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Florianópolis', state: 'SC' },
  { city: 'Joinville', state: 'SC' },
  { city: 'Salvador', state: 'BA' },
  { city: 'Recife', state: 'PE' },
  { city: 'Fortaleza', state: 'CE' },
  { city: 'Goiânia', state: 'GO' },
  { city: 'Brasília', state: 'DF' },
];

const DISTRICTS = [
  'Centro',
  'Jardim América',
  'Vila Mariana',
  'Bela Vista',
  'Pinheiros',
  'Moema',
  'Tijuca',
  'Copacabana',
  'Ipanema',
  'Botafogo',
  'Boa Viagem',
  'Savassi',
  'Batel',
  'Cabral',
  'Asa Norte',
  'Asa Sul',
  'Aldeota',
  'Meireles',
  'Barra',
];

const STREET_PREFIXES = ['Rua', 'Avenida', 'Alameda', 'Travessa', 'Praça'];

const COMPLEMENTS = [
  'Apto 101',
  'Apto 202',
  'Apto 1504',
  'Casa',
  'Casa 2',
  'Bloco A',
  'Bloco B',
  'Fundos',
  'Loja 1',
  'Sala 305',
];

const PRODUCTS: Array<{ name: string; min: number; max: number }> = [
  { name: 'Camiseta básica algodão', min: 3990, max: 7990 },
  { name: 'Camisa polo manga curta', min: 8990, max: 14990 },
  { name: 'Bermuda jeans masculina', min: 9990, max: 16990 },
  { name: 'Calça jeans slim', min: 14990, max: 24990 },
  { name: 'Tênis casual unissex', min: 19990, max: 39990 },
  { name: 'Tênis esportivo corrida', min: 24990, max: 49990 },
  { name: 'Mochila escolar reforçada', min: 12990, max: 22990 },
  { name: 'Boné aba reta', min: 4990, max: 8990 },
  { name: 'Meia esportiva (par)', min: 1990, max: 3990 },
  { name: 'Cinto de couro legítimo', min: 8990, max: 14990 },
  { name: 'Carteira slim', min: 5990, max: 12990 },
  { name: 'Relógio digital esportivo', min: 14990, max: 29990 },
  { name: 'Mouse sem fio ergonômico', min: 6990, max: 14990 },
  { name: 'Teclado mecânico ABNT2', min: 19990, max: 39990 },
  { name: 'Fone de ouvido Bluetooth', min: 12990, max: 34990 },
  { name: 'Caixa de som portátil', min: 9990, max: 19990 },
  { name: 'Garrafa térmica 750ml', min: 4990, max: 9990 },
  { name: 'Caderno universitário 200 folhas', min: 2490, max: 4990 },
  { name: 'Kit canetas esferográficas', min: 990, max: 1990 },
  { name: 'Cabo USB-C 2 metros', min: 1990, max: 3990 },
];

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, passwordHash },
    update: { passwordHash },
  });
}

async function ensureSequence(): Promise<void> {
  await prisma.$executeRawUnsafe('CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1');
}

async function nextSequence(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ nextval: bigint }>>(
    "SELECT nextval('order_number_seq') AS nextval",
  );
  return Number(rows[0]?.nextval ?? 1);
}

function generateCpf(): string {
  const base = Array.from({ length: 9 }, () => faker.number.int({ min: 0, max: 9 }));
  const dv1 = computeCpfDigit(base, 10);
  const dv2 = computeCpfDigit([...base, dv1], 11);
  return [...base, dv1, dv2].join('');
}

function computeCpfDigit(numbers: number[], startWeight: number): number {
  const sum = numbers.reduce((acc, digit, index) => acc + digit * (startWeight - index), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

function generateCnpj(): string {
  const base = Array.from({ length: 12 }, () => faker.number.int({ min: 0, max: 9 }));
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, ...weights1];
  const dv1 = computeCnpjDigit(base, weights1);
  const dv2 = computeCnpjDigit([...base, dv1], weights2);
  return [...base, dv1, dv2].join('');
}

function computeCnpjDigit(numbers: number[], weights: number[]): number {
  const sum = numbers.reduce((acc, digit, index) => acc + digit * weights[index], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function randomDocument(): string {
  return faker.datatype.boolean() ? generateCpf() : generateCnpj();
}

function randomStreet(): string {
  const prefix = faker.helpers.arrayElement(STREET_PREFIXES);
  return `${prefix} ${faker.person.lastName()}`;
}

function randomZipCode(): string {
  return faker.string.numeric(8);
}

function randomItems() {
  const itemsCount = faker.number.int({ min: 1, max: 4 });
  return Array.from({ length: itemsCount }).map(() => {
    const product = faker.helpers.arrayElement(PRODUCTS);
    return {
      description: product.name,
      priceCents: faker.number.int({ min: product.min, max: product.max }),
      quantity: faker.number.int({ min: 1, max: 3 }),
    };
  });
}

async function seedOrders(): Promise<void> {
  await ensureSequence();
  const year = new Date().getFullYear();

  for (let i = 0; i < ORDERS_TO_SEED; i++) {
    const seq = await nextSequence();
    const number = `ORD-${year}-${String(seq).padStart(6, '0')}`;
    const status = faker.helpers.arrayElement(STATUSES);
    const createdAt = faker.date.recent({ days: 90 });
    const deliveryForecastAt = faker.date.soon({ days: 30, refDate: createdAt });
    const location = faker.helpers.arrayElement(BRAZILIAN_CITIES);
    const items = randomItems();
    const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

    await prisma.order.create({
      data: {
        number,
        customerName: faker.person.fullName(),
        customerDocument: randomDocument(),
        deliveryZipCode: randomZipCode(),
        deliveryStreet: randomStreet(),
        deliveryNumber: String(faker.number.int({ min: 1, max: 3500 })),
        deliveryComplement: faker.helpers.maybe(() => faker.helpers.arrayElement(COMPLEMENTS), {
          probability: 0.6,
        }),
        deliveryDistrict: faker.helpers.arrayElement(DISTRICTS),
        deliveryCity: location.city,
        deliveryState: location.state,
        deliveryCountry: 'BR',
        deliveryForecastAt,
        status,
        totalCents,
        createdAt,
        items: { create: items },
        statusHistory: {
          create: { fromStatus: null, toStatus: status, changedAt: createdAt },
        },
      },
    });
  }
}

async function main(): Promise<void> {
  console.log('Seeding admin user…');
  await seedAdmin();
  console.log(`Seeding ${ORDERS_TO_SEED} orders…`);
  await seedOrders();
  console.log(`Done. Login with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
