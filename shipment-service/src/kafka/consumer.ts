import { Kafka } from "kafkajs";
import { prisma } from "../lib/prisma.js";

const kafka = new Kafka({
  clientId: "shipment-service",
  brokers: ["localhost:9092"],
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

      if (event.event !== "CARRIER_SELECTED") {
        return;
      }

      const existingShipment = await prisma.shipment.findFirst({
        where: {
          taskId: event.taskId,
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
          taskId: event.taskId,
          productId: event.productId,
          warehouseId: event.warehouseId,
          quantity: event.quantity,
          carrier: event.carrier,
          serviceLevel: event.serviceLevel,
          weight: event.weight,
          status: "CREATED",
        },
      });

      console.log("🚚 Shipment created:", shipment);
    },
  });
}