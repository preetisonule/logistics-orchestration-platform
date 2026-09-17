
import { prisma } from "../lib/prisma.js";
import { producer } from "./producer.js";

export async function startOutboxPublisher() {
  console.log("📤 Outbox Publisher started");

  setInterval(async () => {
    try {
      const events = await prisma.outboxEvent.findMany({
        where: {
          published: false,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 10,
      });

      for (const event of events) {
        try {
          await producer.send({
            topic: "inventory-events",
            messages: [
              {
                value: event.payload,
              },
            ],
          });

          await prisma.outboxEvent.update({
            where: {
              id: event.id,
            },
            data: {
              published: true,
              publishedAt: new Date(),
            },
          });

          console.log("📤 Outbox event published:", event.id);
        } catch (error) {
          console.error(
            "❌ Failed to publish outbox event:",
            event.id,
            error
          );
        }
      }
    } catch (error) {
      console.error("❌ Outbox publisher error:", error);
    }
  }, 3000);
}
