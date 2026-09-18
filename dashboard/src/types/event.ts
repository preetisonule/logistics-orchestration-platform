export type EventType =
  | "INVENTORY_RESERVED"
  | "PACKAGE_READY"
  | "CARRIER_SELECTED"
  | "SHIPMENT_CREATED";

export interface LogisticsEvent {
  eventId: string;
  eventType: EventType;
  service: string;
  timestamp: string;
  data: Record<string, string | number>;
}
