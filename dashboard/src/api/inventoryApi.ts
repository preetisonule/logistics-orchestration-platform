import { inventoryClient } from "./axios";
import type {
  InventoryRecord,
  Product,
  ReserveInventoryPayload,
} from "../types/inventory";

export async function fetchInventory(): Promise<InventoryRecord[]> {
  const { data } = await inventoryClient.get<InventoryRecord[]>("/inventory");
  return data;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await inventoryClient.get<Product[]>("/products");
  return data;
}

export async function reserveInventory(
  id: string,
  payload: ReserveInventoryPayload,
): Promise<InventoryRecord> {
  const { data } = await inventoryClient.post<InventoryRecord>(
    `/inventory/${id}/reserve`,
    payload,
  );
  return data;
}
