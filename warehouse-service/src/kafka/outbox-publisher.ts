import { prisma } from "../lib/prisma.js";
import { producer } from "./producer.js";

let isRunning = false;
let shouldStop = false;

export async function publishOutboxEventsOnce(): Promise<number> {
  let publishedCount = 0;
  try {
    const events = await prisma.outboxEvent.findMany({
      where: {
        published: false,
        attempts: { lt: 10 },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 10,
    });

    for (const event of events) {
      let key: string | undefined;
      try {
        const parsed = JSON.parse(event.payload);
        key = parsed.data?.taskId || parsed.eventId;
      } catch {
        // payload parse fallback
      }

      try {
        await producer.send({
          topic: "warehouse-events",
          messages: [
            {
              key: key ? String(key) : undefined,
              value: event.payload,
            },
          ],
        });

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            published: true,
            publishedAt: new Date(),
          },
        });

        publishedCount++;
        console.log(`[warehouse-service] 📤 Outbox event published: ${event.id}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[warehouse-service] ❌ Failed to publish outbox event ${event.id}:`, errorMessage);

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            lastError: errorMessage,
          },
        });
      }
    }
  } catch (error) {
    console.error("[warehouse-service] ❌ Outbox publisher loop error:", error);
  }
  return publishedCount;
}

export function startOutboxPublisher(intervalMs = 3000) {
  if (isRunning) return;
  isRunning = true;
  shouldStop = false;

  console.log("[warehouse-service] 📤 Non-overlapping Outbox Publisher started");

  async function loop() {
    if (shouldStop) {
      isRunning = false;
      return;
    }

    await publishOutboxEventsOnce();

    if (!shouldStop) {
      setTimeout(loop, intervalMs);
    } else {
      isRunning = false;
    }
  }

  void loop();
}

export function stopOutboxPublisher() {
  shouldStop = true;
}
