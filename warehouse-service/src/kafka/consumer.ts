import { Kafka } from "kafkajs";
import { prisma } from "../lib/prisma.js";
import { isValidEventEnvelope } from "../events/event.js";

const kafka = new Kafka({
  clientId: "warehouse-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const consumer = kafka.consumer({
  groupId: "warehouse-service-group",
});

export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "inventory-events",
    fromBeginning: false,
  });

  console.log("[warehouse-service] 📦 Kafka Consumer connected");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      let eventRaw: unknown;
      try {
        eventRaw = JSON.parse(message.value.toString());
      } catch {
        console.error(`[warehouse-service] ❌ Malformed JSON message on topic=${topic}, partition=${partition}`);
        return;
      }

      if (!isValidEventEnvelope(eventRaw)) {
        console.warn(`[warehouse-service] ⚠️ Invalid EventEnvelope format received on ${topic}:`, eventRaw);
        return;
      }

      const event = eventRaw;

      if (event.eventType !== "INVENTORY_RESERVED") {
        return;
      }

      console.log(`[warehouse-service] 📦 Processing INVENTORY_RESERVED eventId=${event.eventId}, correlationId=${event.correlationId}`);

      const data = event.data as {
        productId?: string;
        warehouseId?: string;
        quantity?: number;
        inventoryId?: string;
        weightKg?: number;
        serviceLevel?: string;
      };

      if (!data.productId || !data.warehouseId || typeof data.quantity !== "number") {
        console.error(`[warehouse-service] ❌ Malformed event data payload for eventId=${event.eventId}`);
        return;
      }

      // Idempotency check 1: Check existing sourceEventId
      const existingTask = await prisma.warehouseTask.findUnique({
        where: { sourceEventId: event.eventId },
      });

      if (existingTask) {
        console.log(`[warehouse-service] ℹ️ Task already exists for sourceEventId=${event.eventId}. Idempotently skipping.`);
        return;
      }

      try {
        const task = await prisma.warehouseTask.create({
          data: {
            sourceEventId: event.eventId,
            correlationId: event.correlationId,
            inventoryId: data.inventoryId || null,
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: data.quantity,
            weightKg: typeof data.weightKg === "number" ? data.weightKg : 1.0,
            serviceLevel: data.serviceLevel || "STANDARD",
            status: "PICKING_PENDING",
          },
        });

        console.log(`[warehouse-service] 📦 Warehouse task created: id=${task.id}, correlationId=${task.correlationId}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("Unique constraint") || errMsg.includes("sourceEventId")) {
          console.log(`[warehouse-service] ℹ️ Concurrent duplicate event ignored for sourceEventId=${event.eventId}`);
        } else {
          console.error(`[warehouse-service] ❌ Error creating warehouse task for eventId=${event.eventId}:`, err);
        }
      }
    },
  });
}
