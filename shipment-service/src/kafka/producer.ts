import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "shipment-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const producer = kafka.producer();

export async function connectProducer() {
  try {
    await producer.connect();
    console.log("[shipment-service] ⚡ Kafka Producer connected");
  } catch (error) {
    console.error("[shipment-service] ❌ Failed to connect Kafka Producer:", error);
  }
}
