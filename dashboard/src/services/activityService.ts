import type { LogisticsEvent } from "../types/event";

export interface ActivityItem {
  id: string;
  time: string;
  label: string;
  source: string;
}

export function mapEventsToActivity(events: LogisticsEvent[]): ActivityItem[] {
  return events.map((event) => {
    const rawDate = event.occurredAt || event.timestamp;
    const date = rawDate ? new Date(rawDate) : new Date();
    const time = isNaN(date.getTime())
      ? "Just now"
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    let label = event.eventType;
    switch (event.eventType) {
      case "INVENTORY_RESERVED":
        label = "Inventory Reserved";
        break;
      case "PACKAGE_READY":
        label = "Package Ready";
        break;
      case "CARRIER_SELECTED":
        label = "Carrier Selected";
        break;
      case "SHIPMENT_CREATED":
        label = "Shipment Created";
        break;
      case "SHIPMENT_STATUS_UPDATED":
        label = "Shipment Status Updated";
        break;
    }

    return {
      id: event.eventId || event.id || String(Math.random()),
      time,
      label,
      source: event.source || event.service || "event-service",
    };
  });
}
