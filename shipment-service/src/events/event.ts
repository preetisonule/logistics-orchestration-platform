import { randomUUID } from "crypto";

export interface EventEnvelope<T = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  source: string;
  correlationId: string;
  causationId?: string;
  data: T;
}

export function createEvent<T>(
  eventType: string,
  source: string,
  data: T,
  correlationId?: string,
  causationId?: string
): EventEnvelope<T> {
  const eventId = randomUUID();
  return {
    eventId,
    eventType,
    version: 1,
    occurredAt: new Date().toISOString(),
    source,
    correlationId: correlationId || eventId,
    ...(causationId ? { causationId } : {}),
    data,
  };
}

export function isValidEventEnvelope(event: unknown): event is EventEnvelope {
  if (typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.eventId === "string" && e.eventId.length > 0 &&
    typeof e.eventType === "string" && e.eventType.length > 0 &&
    typeof e.version === "number" &&
    typeof e.occurredAt === "string" &&
    typeof e.source === "string" &&
    typeof e.correlationId === "string" &&
    typeof e.data === "object" && e.data !== null
  );
}
