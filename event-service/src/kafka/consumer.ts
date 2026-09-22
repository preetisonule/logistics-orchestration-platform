import { Kafka } from "kafkajs";
import { prisma } from "../lib/prisma.js";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
  clientId: "event-service",
  brokers: [KAFKA_BROKER],
});

export const consumer = kafka.consumer({
  groupId: "event-store-service-group",
});

export async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({ topic: "inventory-events", fromBeginning: true });
  await consumer.subscribe({ topic: "warehouse-events", fromBeginning: true });
  await consumer.subscribe({ topic: "carrier-events", fromBeginning: true });
  await consumer.subscribe({ topic: "shipment-events", fromBeginning: true });

  console.log("[event-service] 📊 Event Store Kafka Consumer connected and subscribed to all topics");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      let eventRaw: unknown;
      try {
        eventRaw = JSON.parse(message.value.toString());
      } catch {
        console.error(`[event-service] ❌ Invalid JSON on topic=${topic}, partition=${partition}`);
        return;
      }

      if (typeof eventRaw !== "object" || eventRaw === null) return;
      const event = eventRaw as Record<string, unknown>;

      const eventId = String(event.eventId || "");
      const eventType = String(event.eventType || "");

      if (!eventId || !eventType) {
        console.warn(`[event-service] ⚠️ Skipping event missing eventId/eventType on ${topic}:`, event);
        return;
      }

      const version = typeof event.version === "number" ? event.version : 1;
      const source = String(event.source || "unknown");
      const correlationId = event.correlationId ? String(event.correlationId) : null;
      const causationId = event.causationId ? String(event.causationId) : null;
      const occurredAt = event.occurredAt ? new Date(String(event.occurredAt)) : new Date();

      try {
        await prisma.eventLog.create({
          data: {
            eventId,
            eventType,
            version,
            source,
            topic,
            correlationId,
            causationId,
            occurredAt: isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
            payload: event as any,
          },
        });

        console.log(`[event-service] 📊 Persisted event: ${eventType} (id=${eventId}, correlationId=${correlationId})`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("Unique constraint") || errMsg.includes("eventId")) {
          console.log(`[event-service] ℹ️ Idempotent skip for duplicate eventId=${eventId}`);
        } else {
          console.error(`[event-service] ❌ Failed to persist eventId=${eventId}:`, err);
        }
      }
    },
  });
}
