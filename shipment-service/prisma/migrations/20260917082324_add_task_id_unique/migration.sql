/*
  Warnings:

  - A unique constraint covering the columns `[taskId]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Shipment_taskId_key" ON "Shipment"("taskId");
