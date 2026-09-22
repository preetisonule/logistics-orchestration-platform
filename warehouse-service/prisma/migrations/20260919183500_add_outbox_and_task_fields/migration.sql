-- AlterTable
ALTER TABLE "WarehouseTask" ADD COLUMN "sourceEventId" TEXT,
ADD COLUMN "correlationId" TEXT,
ADD COLUMN "inventoryId" TEXT,
ADD COLUMN "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "serviceLevel" TEXT NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTask_sourceEventId_key" ON "WarehouseTask"("sourceEventId");

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);
