import { shipmentClient } from "./axios";
import type {
  Shipment,
  UpdateShipmentStatusPayload,
} from "../types/shipment";

export async function fetchShipments(): Promise<Shipment[]> {
  const { data } = await shipmentClient.get<Shipment[]>("/shipments");
  return data;
}

export async function fetchShipmentByTrackingNumber(
  trackingNumber: string,
): Promise<Shipment> {
  const { data } = await shipmentClient.get<Shipment>(
    `/shipments/${trackingNumber}`,
  );
  return data;
}

export async function updateShipmentStatus(
  trackingNumber: string,
  payload: UpdateShipmentStatusPayload,
): Promise<Shipment> {
  const { data } = await shipmentClient.patch<Shipment>(
    `/shipments/${trackingNumber}/status`,
    payload,
  );
  return data;
}
