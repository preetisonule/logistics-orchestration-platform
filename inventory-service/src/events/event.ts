
import { randomUUID } from "crypto";

export function createEvent<T>(eventType: string, data: T) {
  return {
    eventId: randomUUID(),
    eventType,
    version: 1,
    occurredAt: new Date().toISOString(),
    data,
  };
}
