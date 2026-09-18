import { warehouseClient } from "./axios";
import type {
  UpdateWarehouseTaskStatusPayload,
  WarehouseTask,
} from "../types/warehouse";

export async function fetchWarehouseTasks(): Promise<WarehouseTask[]> {
  const { data } = await warehouseClient.get<WarehouseTask[]>("/tasks");
  return data;
}

export async function fetchWarehouseTaskById(id: string): Promise<WarehouseTask> {
  const { data } = await warehouseClient.get<WarehouseTask>(`/tasks/${id}`);
  return data;
}

export async function updateWarehouseTaskStatus(
  id: string,
  payload: UpdateWarehouseTaskStatusPayload,
): Promise<WarehouseTask> {
  const { data } = await warehouseClient.patch<WarehouseTask>(
    `/tasks/${id}/status`,
    payload,
  );
  return data;
}
