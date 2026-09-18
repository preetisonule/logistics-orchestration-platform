import type { InventoryStatus } from "../types/inventory";
import {
  SHIPMENT_STATUS_ORDER,
  type ShipmentStatus,
} from "../types/shipment";
import type { WarehouseTaskStatus } from "../types/warehouse";

export function getInventoryStatus(
  available: number,
  total: number,
): InventoryStatus {
  if (available <= 0) {
    return "DEPLETED";
  }
  if (available <= Math.max(1, Math.floor(total * 0.2))) {
    return "LOW_STOCK";
  }
  return "AVAILABLE";
}

export function getNextShipmentStatus(
  current: ShipmentStatus,
): ShipmentStatus | null {
  const index = SHIPMENT_STATUS_ORDER.indexOf(current);
  if (index === -1 || index === SHIPMENT_STATUS_ORDER.length - 1) {
    return null;
  }
  return SHIPMENT_STATUS_ORDER[index + 1];
}

export function isValidShipmentTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
): boolean {
  const fromIndex = SHIPMENT_STATUS_ORDER.indexOf(from);
  const toIndex = SHIPMENT_STATUS_ORDER.indexOf(to);
  return toIndex === fromIndex + 1;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) {
    return id;
  }
  return `${id.slice(0, length)}…`;
}

const WAREHOUSE_STATUS_ORDER: WarehouseTaskStatus[] = [
  "PICKING_PENDING",
  "PICKED",
  "PACKED",
  "PACKAGE_READY",
];

export function getNextWarehouseStatus(
  current: WarehouseTaskStatus,
): WarehouseTaskStatus | null {
  const index = WAREHOUSE_STATUS_ORDER.indexOf(current);
  if (index === -1 || index === WAREHOUSE_STATUS_ORDER.length - 1) {
    return null;
  }
  return WAREHOUSE_STATUS_ORDER[index + 1];
}

export function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}
