import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "inventory-service",
  brokers: ["localhost:9092"],
});

export const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();

  console.log("Kafka producer connected");
}

export async function publishInventoryReserved(data: {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  await producer.send({
    topic: "inventory-events",
    messages: [
      {
        value: JSON.stringify({
          event: "INVENTORY_RESERVED",
          ...data,
        }),
      },
    ],
  });

  console.log("INVENTORY_RESERVED event published");
}