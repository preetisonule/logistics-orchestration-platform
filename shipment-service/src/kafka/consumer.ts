
import { Kafka } from "kafkajs";

import { prisma } from "../lib/prisma.js";

const kafka = new Kafka({
  clientId: "shipment-service",
  brokers: [process.env.KAFKA_BROKER!],
});

const consumer = kafka.consumer({
  groupId: "shipment-service-group",
});

function generateTrackingNumber() {
  return `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "carrier-events",
    fromBeginning: false,
  });

  console.log("📦 Shipment Service consumer connected");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      console.log("📨 Carrier event received:", event);

      // Handle CARRIER_SELECTED event
      if (event.eventType !== "CARRIER_SELECTED") {
        return;
      }

      const data = event.data;

      // Idempotency check
      const existingShipment = await prisma.shipment.findFirst({
        where: {
          taskId: data.taskId,
        },
      });

      if (existingShipment) {
        console.log(
          "⚠️ Shipment already exists:",
          existingShipment.trackingNumber
        );
        return;
      }

      const trackingNumber = generateTrackingNumber();

      const shipment = await prisma.shipment.create({
        data: {
          trackingNumber,
          taskId: data.taskId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          carrier: data.carrier,
          serviceLevel: data.serviceLevel,
          weight: data.weight,
          status: "CREATED",
        },
      });

      console.log("🚚 Shipment created:", shipment);
    },
  });
}

