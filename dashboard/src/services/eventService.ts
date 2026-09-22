import { eventClient } from "../api/axios";
import type { LogisticsEvent } from "../types/event";

export interface EventFilterOptions {
  limit?: number;
  eventType?: string;
  source?: string;
  correlationId?: string;
}

export async function fetchEvents(options?: EventFilterOptions): Promise<LogisticsEvent[]> {
  try {
    const params: Record<string, string | number> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.eventType && options.eventType !== "ALL") params.eventType = options.eventType;
    if (options?.source && options.source !== "ALL") params.source = options.source;
    if (options?.correlationId) params.correlationId = options.correlationId;

    const { data } = await eventClient.get<LogisticsEvent[]>("/events", { params });

    return data.map((item) => {
      const payloadData = item.payload && typeof item.payload === "object" && "data" in item.payload
        ? (item.payload.data as Record<string, unknown>)
        : item.payload || {};

      return {
        ...item,
        service: item.source || item.service || "unknown-service",
        timestamp: item.occurredAt || item.timestamp || new Date().toISOString(),
        data: payloadData,
      };
    });
  } catch (error) {
    console.warn("Real Event API unavailable, returning empty list:", error);
    return [];
  }
}
