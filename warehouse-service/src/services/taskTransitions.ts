import { prisma } from "../lib/prisma.js";
import { createEvent } from "../events/event.js";

export type WarehouseTaskStatus =
  | "PICKING_PENDING"
  | "PICKED"
  | "PACKED"
  | "PACKAGE_READY";

const STATUS_ORDER: WarehouseTaskStatus[] = [
  "PICKING_PENDING",
  "PICKED",
  "PACKED",
  "PACKAGE_READY",
];

export class TransitionConflictError extends Error {
  constructor(message = "Status transition conflict") {
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

export class TaskNotFoundError extends Error {
  constructor(message = "Warehouse task not found") {
    super(message);
    this.name = "TaskNotFoundError";
  }
}

export function getNextWarehouseTaskStatus(
  current: WarehouseTaskStatus,
): WarehouseTaskStatus | null {
  const index = STATUS_ORDER.indexOf(current);
  if (index === -1 || index === STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[index + 1];
}

export function isValidWarehouseTransition(
  currentStatus: string,
  nextStatus: string,
): boolean {
  return getNextWarehouseTaskStatus(currentStatus as WarehouseTaskStatus) === nextStatus;
}

function observabilityEventTypeForTransition(
  nextStatus: WarehouseTaskStatus,
): string | null {
  switch (nextStatus) {
    case "PICKED":
      return "WAREHOUSE_TASK_PICKED";
    case "PACKED":
      return "WAREHOUSE_TASK_PACKED";
    case "PACKAGE_READY":
      return "PACKAGE_READY";
    default:
      return null;
  }
}

function buildTransitionEventPayload(
  task: {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    weightKg: number;
    serviceLevel: string;
    automationMode: string;
    correlationId: string | null;
    sourceEventId: string | null;
    status: string;
  },
  eventType: string,
) {
  const baseData = {
    taskId: task.id,
    productId: task.productId,
    warehouseId: task.warehouseId,
    quantity: task.quantity,
    weightKg: task.weightKg,
    serviceLevel: task.serviceLevel,
    automationMode: task.automationMode,
    status: task.status,
  };

  return createEvent(
    eventType,
    "warehouse-service",
    baseData,
    task.correlationId || undefined,
    task.sourceEventId || undefined,
  );
}

export async function transitionWarehouseTaskStatus(
  taskId: string,
  nextStatus: WarehouseTaskStatus,
) {
  const task = await prisma.warehouseTask.findUnique({ where: { id: taskId } });

  if (!task) {
    throw new TaskNotFoundError();
  }

  if (!isValidWarehouseTransition(task.status, nextStatus)) {
    throw new InvalidTransitionError(
      `Invalid status transition from ${task.status} to ${nextStatus}`,
    );
  }

  const expectedFrom = task.status;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.warehouseTask.updateMany({
      where: { id: taskId, status: expectedFrom },
      data: { status: nextStatus },
    });

    if (count !== 1) {
      throw new TransitionConflictError();
    }

    const updated = await tx.warehouseTask.findUniqueOrThrow({
      where: { id: taskId },
    });

    const eventType = observabilityEventTypeForTransition(nextStatus);
    if (eventType) {
      const envelope = buildTransitionEventPayload(updated, eventType);
      await tx.outboxEvent.create({
        data: {
          eventType,
          payload: JSON.stringify(envelope),
        },
      });
    }

    return updated;
  });
}

export async function advanceWarehouseTaskById(taskId: string) {
  const task = await prisma.warehouseTask.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskNotFoundError();
  }

  const next = getNextWarehouseTaskStatus(task.status as WarehouseTaskStatus);
  if (!next) {
    throw new InvalidTransitionError(`Task ${taskId} cannot be advanced from ${task.status}`);
  }

  return transitionWarehouseTaskStatus(taskId, next);
}
