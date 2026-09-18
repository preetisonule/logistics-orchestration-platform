import type { LogisticsEvent } from "../types/event";

/**
 * TODO: Replace with a backend Event API when available.
 * Future flow: Backend Event API → WebSocket/SSE → React Dashboard
 */
export async function fetchEvents(): Promise<LogisticsEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return MOCK_EVENTS;
}

const MOCK_EVENTS: LogisticsEvent[] = [
  {
    eventId: "evt-001",
    eventType: "INVENTORY_RESERVED",
    service: "inventory-service",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    data: {
      inventoryId: "inv-001",
      productId: "prod-001",
      warehouseId: "wh-001",
      quantity: 5,
    },
  },
  {
    eventId: "evt-002",
    eventType: "PACKAGE_READY",
    service: "warehouse-service",
    timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    data: {
      taskId: "task-001",
      productId: "prod-001",
      warehouseId: "wh-001",
      quantity: 5,
    },
  },
  {
    eventId: "evt-003",
    eventType: "CARRIER_SELECTED",
    service: "carrier-selection-service",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    data: {
      taskId: "task-001",
      carrier: "DELHIVERY",
      serviceLevel: "EXPRESS",
      weight: 2,
    },
  },
  {
    eventId: "evt-004",
    eventType: "SHIPMENT_CREATED",
    service: "shipment-service",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    data: {
      trackingNumber: "TRK-20260918-001",
      carrier: "DELHIVERY",
      status: "CREATED",
    },
  },
];
