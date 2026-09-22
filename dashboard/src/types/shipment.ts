export type ShipmentStatus =
  | "CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  "CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

import type { AutomationPipelineMode } from "./automationMode";

export interface Shipment {
  id: string;
  trackingNumber: string;
  taskId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  carrier: string;
  serviceLevel: string;
  weight: number;
  automationMode: AutomationPipelineMode;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShipmentStatusPayload {
  status: ShipmentStatus;
}
