-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN "sourceEventId" TEXT,
ADD COLUMN "correlationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_sourceEventId_key" ON "Shipment"("sourceEventId");

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
