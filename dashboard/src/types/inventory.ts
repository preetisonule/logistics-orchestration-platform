export interface Product {
  id: string;
  name: string;
  sku: string;
  weightKg: number;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  totalQuantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRow extends InventoryRecord {
  productName: string;
  productSku: string;
  productWeightKg: number;
  warehouseName: string;
  warehouseLocation: string;
  warehouseLabel: string;
  availableQuantity: number;
  status: InventoryStatus;
}

export type InventoryStatus = "AVAILABLE" | "LOW_STOCK" | "DEPLETED";

export interface ReserveInventoryPayload {
  quantity: number;
  serviceLevel?: "STANDARD" | "EXPRESS";
}
