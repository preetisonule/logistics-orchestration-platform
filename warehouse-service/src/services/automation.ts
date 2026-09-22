import { prisma } from "../lib/prisma.js";
import {
  TransitionConflictError,
  advanceWarehouseTaskById,
  getNextWarehouseTaskStatus,
  type WarehouseTaskStatus,
} from "./taskTransitions.js";

let isRunning = false;
let shouldStop = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

function getStepDelayMs(): number {
  const parsed = Number(process.env.AUTOMATION_STEP_DELAY_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
}

function getPollIntervalMs(): number {
  const parsed = Number(process.env.AUTOMATION_POLL_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

export async function processAutomatedWarehouseTasksOnce(): Promise<number> {
  const stepDelayMs = getStepDelayMs();
  const cutoff = new Date(Date.now() - stepDelayMs);

  const task = await prisma.warehouseTask.findFirst({
    where: {
      automationMode: "AUTONOMOUS",
      status: { in: ["PICKING_PENDING", "PICKED", "PACKED"] },
      updatedAt: { lte: cutoff },
    },
    orderBy: { updatedAt: "asc" },
  });

  if (!task) {
    return 0;
  }

  const nextStatus = getNextWarehouseTaskStatus(task.status as WarehouseTaskStatus);
  if (!nextStatus) {
    return 0;
  }

  try {
    const updated = await advanceWarehouseTaskById(task.id);
    console.log(
      `[warehouse-service] 🤖 Automated task ${updated.id}: ${task.status} -> ${updated.status}`,
    );
    return 1;
  } catch (error) {
    if (error instanceof TransitionConflictError) {
      return 0;
    }

    console.error(
      `[warehouse-service] ❌ Automation failed taskId=${task.id} current=${task.status} target=${nextStatus}:`,
      error,
    );
    return 0;
  }
}

function schedulePoll(): void {
  if (shouldStop) {
    isRunning = false;
    return;
  }

  pollTimer = setTimeout(() => {
    void (async () => {
      try {
        await processAutomatedWarehouseTasksOnce();
      } catch (error) {
        console.error("[warehouse-service] ❌ Automation poll error:", error);
      } finally {
        schedulePoll();
      }
    })();
  }, getPollIntervalMs());
}

export function startWarehouseAutomationWorker(): void {
  if (isRunning) {
    return;
  }

  isRunning = true;
  shouldStop = false;

  console.log(
    `[warehouse-service] 🤖 Warehouse automation worker started (poll=${getPollIntervalMs()}ms, stepDelay=${getStepDelayMs()}ms)`,
  );

  schedulePoll();
}

export function stopWarehouseAutomationWorker(): void {
  shouldStop = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}
