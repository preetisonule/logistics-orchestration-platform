export type EventType =
  | "INVENTORY_RESERVED"
  | "PACKAGE_READY"
  | "CARRIER_SELECTED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_STATUS_UPDATED";

export interface LogisticsEvent {
  id?: string;
  eventId: string;
  eventType: string;
  version?: number;
  source: string;
  topic?: string;
  correlationId?: string | null;
  causationId?: string | null;
  occurredAt?: string;
  receivedAt?: string;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  // Derived helper fields for UI compatibility
  timestamp?: string;
  service?: string;
}
