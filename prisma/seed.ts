import { faker } from '@faker-js/faker';
import { type OrderStatus, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const ADMIN_EMAIL = 'admin@naporta.test';
const ADMIN_PASSWORD = 'Admin@123';
const ORDERS_TO_SEED = 50;
const STATUSES: OrderStatus[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELED'];
const UF_LIST = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO'];

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

async function seedOrders(): Promise<void> {
  await ensureSequence();
  const year = new Date().getFullYear();

  for (let i = 0; i < ORDERS_TO_SEED; i++) {
    const seq = await nextSequence();
    const number = `ORD-${year}-${String(seq).padStart(6, '0')}`;
    const status = faker.helpers.arrayElement(STATUSES);
    const createdAt = faker.date.recent({ days: 90 });
    const deliveryForecastAt = faker.date.soon({ days: 30, refDate: createdAt });
    const itemsCount = faker.number.int({ min: 1, max: 5 });

    await prisma.order.create({
      data: {
        number,
        customerName: faker.person.fullName(),
        customerDocument: randomDocument(),
        deliveryZipCode: faker.string.numeric(8),
        deliveryStreet: faker.location.street(),
        deliveryNumber: String(faker.number.int({ min: 1, max: 9999 })),
        deliveryComplement: faker.helpers.maybe(
          () => `Apto ${faker.number.int({ min: 1, max: 200 })}`,
        ),
        deliveryDistrict: faker.location.county(),
        deliveryCity: faker.location.city(),
        deliveryState: faker.helpers.arrayElement(UF_LIST),
        deliveryCountry: 'BR',
        deliveryForecastAt,
        status,
        createdAt,
        items: {
          create: Array.from({ length: itemsCount }).map(() => ({
            description: faker.commerce.productName(),
            priceCents: faker.number.int({ min: 1000, max: 50000 }),
          })),
        },
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
