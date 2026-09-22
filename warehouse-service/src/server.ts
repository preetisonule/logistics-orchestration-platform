import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { connectProducer, producer } from "./kafka/producer.js";
import { startConsumer, consumer } from "./kafka/consumer.js";
import { startOutboxPublisher, stopOutboxPublisher } from "./kafka/outbox-publisher.js";
import { startWarehouseAutomationWorker, stopWarehouseAutomationWorker } from "./services/automation.js";

const PORT = Number(process.env.PORT) || 3002;
const DATABASE_URL = process.env.DATABASE_URL;
const KAFKA_BROKER = process.env.KAFKA_BROKER;

if (!DATABASE_URL || !KAFKA_BROKER) {
  console.error("❌ Fatal Configuration Error: DATABASE_URL and KAFKA_BROKER must be set.");
  process.exit(1);
}

async function startServer() {
  await connectProducer();
  startOutboxPublisher();
  await startConsumer();
  startWarehouseAutomationWorker();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Warehouse Service running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    stopWarehouseAutomationWorker();
    stopOutboxPublisher();
    server.close(async () => {
      try {
        await consumer.disconnect();
        await producer.disconnect();
        await prisma.$disconnect();
        console.log("👋 Warehouse Service shut down cleanly.");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void startServer();
