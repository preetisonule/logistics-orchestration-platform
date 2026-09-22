export type WarehouseTaskStatus =
  | "PICKING_PENDING"
  | "PICKED"
  | "PACKED"
  | "PACKAGE_READY";

import type { AutomationPipelineMode } from "./automationMode";

export interface WarehouseTask {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  automationMode: AutomationPipelineMode;
  status: WarehouseTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWarehouseTaskStatusPayload {
  status: WarehouseTaskStatus;
}
