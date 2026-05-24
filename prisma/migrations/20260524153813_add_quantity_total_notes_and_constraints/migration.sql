-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "order_status_history" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "totalCents" INTEGER NOT NULL DEFAULT 0;

-- Sequence (moved from PrismaService.onModuleInit)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- CheckConstraint: positive prices and quantities
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_price_non_negative" CHECK ("priceCents" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" >= 1);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_total_non_negative" CHECK ("totalCents" >= 0);

-- CheckConstraint: delivery forecast must be after the creation timestamp
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_forecast_after_creation" CHECK ("deliveryForecastAt" > "createdAt");
