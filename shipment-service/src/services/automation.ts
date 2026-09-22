import { prisma } from "../lib/prisma.js";
import {
  TransitionConflictError,
  advanceShipmentByTrackingNumber,
  getNextShipmentStatus,
  type ShipmentStatus,
} from "./shipmentTransitions.js";

let isRunning = false;
let shouldStop = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

function getStepDelayMs(): number {
  const parsed = Number(process.env.SHIPMENT_TRANSIT_STEP_DELAY_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function getPollIntervalMs(): number {
  const parsed = Number(process.env.SHIPMENT_AUTOMATION_POLL_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

export async function processAutomatedShipmentTransitOnce(): Promise<number> {
  const stepDelayMs = getStepDelayMs();
  const cutoff = new Date(Date.now() - stepDelayMs);

  const shipment = await prisma.shipment.findFirst({
    where: {
      automationMode: "AUTONOMOUS",
      status: { in: ["CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
      updatedAt: { lte: cutoff },
    },
    orderBy: { updatedAt: "asc" },
  });

  if (!shipment) {
    return 0;
  }

  const nextStatus = getNextShipmentStatus(shipment.status as ShipmentStatus);
  if (!nextStatus) {
    return 0;
  }

  try {
    const updated = await advanceShipmentByTrackingNumber(shipment.trackingNumber);
    console.log(
      `[shipment-service] 🤖 Automated transit ${updated.trackingNumber}: ${shipment.status} -> ${updated.status}`,
    );
    return 1;
  } catch (error) {
    if (error instanceof TransitionConflictError) {
      return 0;
    }

    console.error(
      `[shipment-service] ❌ Automation failed trackingNumber=${shipment.trackingNumber} current=${shipment.status} target=${nextStatus}:`,
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
        await processAutomatedShipmentTransitOnce();
      } catch (error) {
        console.error("[shipment-service] ❌ Shipment automation poll error:", error);
      } finally {
        schedulePoll();
      }
    })();
  }, getPollIntervalMs());
}

export function startShipmentAutomationWorker(): void {
  if (isRunning) {
    return;
  }

  isRunning = true;
  shouldStop = false;

  console.log(
    `[shipment-service] 🤖 Shipment transit automation worker started (poll=${getPollIntervalMs()}ms, stepDelay=${getStepDelayMs()}ms)`,
  );

  schedulePoll();
}

export function stopShipmentAutomationWorker(): void {
  shouldStop = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}
