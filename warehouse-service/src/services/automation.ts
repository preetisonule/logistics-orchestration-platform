import { prisma } from "../lib/prisma.js";
import { createEvent } from "../events/event.js";

let isAutomationEnabled = process.env.AUTOMATE_WAREHOUSE_TASKS !== "false";
let isRunning = false;
let shouldStop = false;

export function getWarehouseAutomationStatus(): boolean {
  return isAutomationEnabled;
}

export function setWarehouseAutomationStatus(enabled: boolean): boolean {
  isAutomationEnabled = enabled;
  console.log(`[warehouse-service] 🤖 Warehouse Task Automation set to: ${enabled ? "ON" : "OFF"}`);
  return isAutomationEnabled;
}

export async function processAutomatedWarehouseTasksOnce(): Promise<number> {
  if (!isAutomationEnabled) return 0;

  let processedCount = 0;
  try {
    // 1. Advance PICKING_PENDING -> PICKED
    const pendingTask = await prisma.warehouseTask.findFirst({
      where: { status: "PICKING_PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (pendingTask) {
      await prisma.warehouseTask.update({
        where: { id: pendingTask.id },
        data: { status: "PICKED" },
      });
      processedCount++;
      console.log(`[warehouse-service] 🤖 Automated Task: ${pendingTask.id} PICKING_PENDING -> PICKED`);
      return processedCount;
    }

    // 2. Advance PICKED -> PACKED
    const pickedTask = await prisma.warehouseTask.findFirst({
      where: { status: "PICKED" },
      orderBy: { createdAt: "asc" },
    });

    if (pickedTask) {
      await prisma.warehouseTask.update({
        where: { id: pickedTask.id },
        data: { status: "PACKED" },
      });
      processedCount++;
      console.log(`[warehouse-service] 🤖 Automated Task: ${pickedTask.id} PICKED -> PACKED`);
      return processedCount;
    }

    // 3. Advance PACKED -> PACKAGE_READY (with Transactional Outbox)
    const packedTask = await prisma.warehouseTask.findFirst({
      where: { status: "PACKED" },
      orderBy: { createdAt: "asc" },
    });

    if (packedTask) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.warehouseTask.update({
          where: { id: packedTask.id },
          data: { status: "PACKAGE_READY" },
        });

        const packageReadyEvent = createEvent(
          "PACKAGE_READY",
          "warehouse-service",
          {
            taskId: updated.id,
            productId: updated.productId,
            warehouseId: updated.warehouseId,
            quantity: updated.quantity,
            weightKg: updated.weightKg,
            serviceLevel: updated.serviceLevel,
          },
          updated.correlationId || undefined,
          updated.sourceEventId || undefined
        );

        await tx.outboxEvent.create({
          data: {
            eventType: "PACKAGE_READY",
            payload: JSON.stringify(packageReadyEvent),
          },
        });
      });

      processedCount++;
      console.log(`[warehouse-service] 🤖 Automated Task: ${packedTask.id} PACKED -> PACKAGE_READY (Outbox Event Created)`);
      return processedCount;
    }
  } catch (error) {
    console.error("[warehouse-service] ❌ Error in warehouse task automation worker:", error);
  }

  return processedCount;
}

export function startWarehouseAutomationWorker(intervalMs = 2500) {
  if (isRunning) return;
  isRunning = true;
  shouldStop = false;

  console.log(`[warehouse-service] 🤖 Warehouse Task Automation Worker started (Status: ${isAutomationEnabled ? "ACTIVE" : "PAUSED"})`);

  async function loop() {
    if (shouldStop) {
      isRunning = false;
      return;
    }

    await processAutomatedWarehouseTasksOnce();

    if (!shouldStop) {
      setTimeout(loop, intervalMs);
    } else {
      isRunning = false;
    }
  }

  void loop();
}

export function stopWarehouseAutomationWorker() {
  shouldStop = true;
}
