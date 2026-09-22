import { prisma } from "../lib/prisma.js";
import { createEvent } from "../events/event.js";

export type ShipmentStatus =
  | "CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

const STATUS_ORDER: ShipmentStatus[] = [
  "CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export class TransitionConflictError extends Error {
  constructor(message = "Shipment status transition conflict") {
    super(message);
    this.name = "TransitionConflictError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransitionError";
  }
}

export class ShipmentNotFoundError extends Error {
  constructor(message = "Shipment not found") {
    super(message);
    this.name = "ShipmentNotFoundError";
  }
}

export function getNextShipmentStatus(current: ShipmentStatus): ShipmentStatus | null {
  const index = STATUS_ORDER.indexOf(current);
  if (index === -1 || index === STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[index + 1];
}

export function isValidShipmentTransition(
  currentStatus: string,
  nextStatus: string,
): boolean {
  return getNextShipmentStatus(currentStatus as ShipmentStatus) === nextStatus;
}

function observabilityEventTypeForTransition(nextStatus: ShipmentStatus): string {
  switch (nextStatus) {
    case "IN_TRANSIT":
      return "SHIPMENT_IN_TRANSIT";
    case "OUT_FOR_DELIVERY":
      return "SHIPMENT_OUT_FOR_DELIVERY";
    case "DELIVERED":
      return "SHIPMENT_DELIVERED";
    default:
      return "SHIPMENT_STATUS_UPDATED";
  }
}

export async function transitionShipmentStatus(
  trackingNumber: string,
  nextStatus: ShipmentStatus,
) {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
  });

  if (!shipment) {
    throw new ShipmentNotFoundError();
  }

  if (!isValidShipmentTransition(shipment.status, nextStatus)) {
    throw new InvalidTransitionError(
      `Invalid status transition from ${shipment.status} to ${nextStatus}`,
    );
  }

  const expectedFrom = shipment.status;
  const previousStatus = shipment.status;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.shipment.updateMany({
      where: { trackingNumber, status: expectedFrom },
      data: { status: nextStatus },
    });

    if (count !== 1) {
      throw new TransitionConflictError();
    }

    const updated = await tx.shipment.findUniqueOrThrow({
      where: { trackingNumber },
    });

    const eventType = observabilityEventTypeForTransition(nextStatus);
    const statusEvent = createEvent(
      eventType,
      "shipment-service",
      {
        shipmentId: updated.id,
        trackingNumber: updated.trackingNumber,
        previousStatus,
        status: updated.status,
        carrier: updated.carrier,
        automationMode: updated.automationMode,
      },
      updated.correlationId || undefined,
      updated.id,
    );

    await tx.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(statusEvent),
      },
    });

    return updated;
  });
}

export async function advanceShipmentByTrackingNumber(trackingNumber: string) {
  const shipment = await prisma.shipment.findUnique({ where: { trackingNumber } });
  if (!shipment) {
    throw new ShipmentNotFoundError();
  }

  const next = getNextShipmentStatus(shipment.status as ShipmentStatus);
  if (!next) {
    throw new InvalidTransitionError(
      `Shipment ${trackingNumber} cannot be advanced from ${shipment.status}`,
    );
  }

  return transitionShipmentStatus(trackingNumber, next);
}
