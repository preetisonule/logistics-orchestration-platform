import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { startConsumer, consumer } from "./kafka/consumer.js";

const PORT = Number(process.env.PORT) || 3005;
const DATABASE_URL = process.env.DATABASE_URL;
const KAFKA_BROKER = process.env.KAFKA_BROKER;

if (!DATABASE_URL || !KAFKA_BROKER) {
  console.error("❌ Fatal Configuration Error: DATABASE_URL and KAFKA_BROKER must be set.");
  process.exit(1);
}

async function startServer() {
  await startConsumer();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Event Store Service running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down Event Service...`);
    server.close(async () => {
      try {
        await consumer.disconnect();
        await prisma.$disconnect();
        console.log("👋 Event Service shut down cleanly.");
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
