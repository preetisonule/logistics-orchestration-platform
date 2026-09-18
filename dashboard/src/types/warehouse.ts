export type WarehouseTaskStatus =
  | "PICKING_PENDING"
  | "PICKED"
  | "PACKED"
  | "PACKAGE_READY";

export interface WarehouseTask {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: WarehouseTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWarehouseTaskStatusPayload {
  status: WarehouseTaskStatus;
}
