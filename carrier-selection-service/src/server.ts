import "dotenv/config";
import http from "http";
import { Kafka } from "kafkajs";
import { randomUUID } from "crypto";
import { selectCarrier, isValidEventEnvelope, carriers } from "./carrierEngine.js";

export { selectCarrier, isValidEventEnvelope, carriers };

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
const PORT = Number(process.env.PORT) || 3003;

async function start() {
  const kafka = new Kafka({
    clientId: "carrier-selection-service",
    brokers: [KAFKA_BROKER],
  });

  const consumer = kafka.consumer({
    groupId: "carrier-selection-service-group",
  });

  const producer = kafka.producer();

  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({
    topic: "warehouse-events",
    fromBeginning: false,
  });

  console.log("[carrier-selection-service] 🚚 Carrier Selection Service connected to Kafka");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      let eventRaw: unknown;
      try {
        eventRaw = JSON.parse(message.value.toString());
      } catch {
        console.error(`[carrier-selection-service] ❌ Malformed JSON on topic=${topic}, partition=${partition}`);
        return;
      }

      if (!isValidEventEnvelope(eventRaw)) {
        console.warn(`[carrier-selection-service] ⚠️ Invalid EventEnvelope format received on ${topic}:`, eventRaw);
        return;
      }

      const event = eventRaw as {
        eventId: string;
        eventType: string;
        correlationId: string;
        causationId?: string;
        data: {
          taskId?: string;
          productId?: string;
          warehouseId?: string;
          quantity?: number;
          weightKg?: number;
          serviceLevel?: string;
          automationMode?: string;
        };
      };

      if (event.eventType !== "PACKAGE_READY") {
        return;
      }

      const data = event.data;
      if (!data.taskId || !data.productId || !data.warehouseId || typeof data.quantity !== "number") {
        console.error(`[carrier-selection-service] ❌ Malformed event data for eventId=${event.eventId}`);
        return;
      }

      const weightKg = typeof data.weightKg === "number" ? data.weightKg : 1.0;
      const serviceLevel = data.serviceLevel || "STANDARD";

      console.log(`[carrier-selection-service] 📦 Evaluating carriers for taskId=${data.taskId}, weight=${weightKg}kg, SLA=${serviceLevel}`);

      try {
        const { carrier, selectionReason } = selectCarrier(weightKg, serviceLevel);

        console.log(`[carrier-selection-service] 🚚 Carrier selected: ${carrier.name} for taskId=${data.taskId}`);

        const carrierEvent = {
          eventId: randomUUID(),
          eventType: "CARRIER_SELECTED",
          version: 1,
          occurredAt: new Date().toISOString(),
          source: "carrier-selection-service",
          correlationId: event.correlationId || event.eventId,
          causationId: event.eventId,
          data: {
            taskId: data.taskId,
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: data.quantity,
            carrier: carrier.name,
            serviceLevel,
            weightKg,
            selectionReason,
            automationMode: data.automationMode === "AUTONOMOUS" ? "AUTONOMOUS" : "MANUAL",
          },
        };

        await producer.send({
          topic: "carrier-events",
          messages: [
            {
              key: String(data.taskId),
              value: JSON.stringify(carrierEvent),
            },
          ],
        });

        console.log(`[carrier-selection-service] 🚚 CARRIER_SELECTED event published for taskId=${data.taskId}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[carrier-selection-service] ❌ Carrier selection failed for taskId=${data.taskId}:`, errMsg);
      }
    },
  });

  const httpServer = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ service: "carrier-selection-service", status: "ok" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Not found" }));
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Carrier Selection Service HTTP listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down Carrier Selection Service...`);
    httpServer.close(async () => {
      try {
        await consumer.disconnect();
        await producer.disconnect();
        console.log("👋 Carrier Selection Service shut down cleanly.");
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

start().catch((error) => {
  console.error("Carrier Selection Service failed:", error);
});
