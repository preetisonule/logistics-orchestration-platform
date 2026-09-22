import { Kafka } from "kafkajs";
import randomBytes from "crypto";
import { prisma } from "../lib/prisma.js";
import { createEvent, isValidEventEnvelope } from "../events/event.js";

const kafka = new Kafka({
  clientId: "shipment-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const consumer = kafka.consumer({
  groupId: "shipment-service-group",
});

export function generateTrackingNumber(): string {
  const hex = randomBytes.randomBytes(4).toString("hex").toUpperCase();
  return `LOG-2026-${hex}`;
}

export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "carrier-events",
    fromBeginning: false,
  });

  console.log("[shipment-service] 📦 Shipment Service consumer connected");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      let eventRaw: unknown;
      try {
        eventRaw = JSON.parse(message.value.toString());
      } catch {
        console.error(`[shipment-service] ❌ Malformed JSON message on topic=${topic}, partition=${partition}`);
        return;
      }

      if (!isValidEventEnvelope(eventRaw)) {
        console.warn(`[shipment-service] ⚠️ Invalid EventEnvelope format received on ${topic}:`, eventRaw);
        return;
      }

      const event = eventRaw;

      if (event.eventType !== "CARRIER_SELECTED") {
        return;
      }

      console.log(`[shipment-service] 📨 Processing CARRIER_SELECTED eventId=${event.eventId}, correlationId=${event.correlationId}`);

      const data = event.data as {
        taskId?: string;
        productId?: string;
        warehouseId?: string;
        quantity?: number;
        carrier?: string;
        serviceLevel?: string;
        weightKg?: number;
        weight?: number;
      };

      if (!data.taskId || !data.productId || !data.warehouseId || !data.carrier) {
        console.error(`[shipment-service] ❌ Malformed event data payload for eventId=${event.eventId}`);
        return;
      }

      // Idempotency check 1: check taskId
      const existingShipmentByTask = await prisma.shipment.findUnique({
        where: { taskId: data.taskId },
      });

      if (existingShipmentByTask) {
        console.log(`[shipment-service] ⚠️ Shipment already exists for taskId=${data.taskId}: trackingNumber=${existingShipmentByTask.trackingNumber}`);
        return;
      }

      // Idempotency check 2: check sourceEventId
      const existingShipmentByEvent = await prisma.shipment.findUnique({
        where: { sourceEventId: event.eventId },
      });

      if (existingShipmentByEvent) {
        console.log(`[shipment-service] ⚠️ Shipment already exists for sourceEventId=${event.eventId}`);
        return;
      }

      const trackingNumber = generateTrackingNumber();
      const weight = typeof data.weightKg === "number" ? data.weightKg : (typeof data.weight === "number" ? data.weight : 1.0);

      try {
        const shipment = await prisma.$transaction(async (tx) => {
          const newShipment = await tx.shipment.create({
            data: {
              trackingNumber,
              sourceEventId: event.eventId,
              correlationId: event.correlationId,
              taskId: data.taskId!,
              productId: data.productId!,
              warehouseId: data.warehouseId!,
              quantity: data.quantity || 1,
              carrier: data.carrier!,
              serviceLevel: data.serviceLevel || "STANDARD",
              weight,
              status: "CREATED",
            },
          });

          const createdEvent = createEvent(
            "SHIPMENT_CREATED",
            "shipment-service",
            {
              shipmentId: newShipment.id,
              trackingNumber: newShipment.trackingNumber,
              taskId: newShipment.taskId,
              carrier: newShipment.carrier,
              serviceLevel: newShipment.serviceLevel,
              weight: newShipment.weight,
              status: newShipment.status,
            },
            newShipment.correlationId || undefined,
            event.eventId
          );

          await tx.outboxEvent.create({
            data: {
              eventType: "SHIPMENT_CREATED",
              payload: JSON.stringify(createdEvent),
            },
          });

          return newShipment;
        });

        console.log(`[shipment-service] 🚚 Shipment created: trackingNumber=${shipment.trackingNumber}, correlationId=${shipment.correlationId}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("Unique constraint") || errMsg.includes("taskId") || errMsg.includes("sourceEventId")) {
          console.log(`[shipment-service] ℹ️ Duplicate event safely ignored via unique constraint conflict.`);
        } else {
          console.error(`[shipment-service] ❌ Failed to create shipment for taskId=${data.taskId}:`, err);
        }
      }
    },
  });
}
