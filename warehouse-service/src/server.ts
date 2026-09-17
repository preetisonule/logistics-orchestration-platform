
import "dotenv/config";

import express from "express";

import { Kafka } from "kafkajs";

import { randomUUID } from "crypto";

import { prisma } from "./lib/prisma.js";

const app = express();

const PORT = 3002;

app.use(express.json());

const kafka = new Kafka({
  clientId: "warehouse-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "warehouse-service-group",
});

const producer = kafka.producer();

async function startKafka() {
  await producer.connect();

  await consumer.connect();

  await consumer.subscribe({
    topic: "inventory-events",
    fromBeginning: false,
  });

  console.log("Warehouse Kafka connected");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      console.log("📦 Event received:", event);

      // Handle INVENTORY_RESERVED event
      if (event.eventType === "INVENTORY_RESERVED") {
        const data = event.data;

        const task = await prisma.warehouseTask.create({
          data: {
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: data.quantity,
          },
        });

        console.log("📦 Warehouse task created:", task);
      }
    },
  });
}

/*
 * Get all warehouse tasks
 */

app.get("/tasks", async (_req, res) => {
  try {
    const tasks = await prisma.warehouseTask.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch warehouse tasks",
    });
  }
});

/*
 * Get one warehouse task
 */

app.get("/tasks/:id", async (req, res) => {
  try {
    const task = await prisma.warehouseTask.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Warehouse task not found",
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch warehouse task",
    });
  }
});

/*
 * Update task status
 */

app.patch("/tasks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PICKING_PENDING",
      "PICKED",
      "PACKED",
      "PACKAGE_READY",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const task = await prisma.warehouseTask.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Warehouse task not found",
      });
    }

    const validTransition =
      (task.status === "PICKING_PENDING" && status === "PICKED") ||
      (task.status === "PICKED" && status === "PACKED") ||
      (task.status === "PACKED" && status === "PACKAGE_READY");

    if (!validTransition) {
      return res.status(400).json({
        message: `Invalid transition from ${task.status} to ${status}`,
      });
    }

    const updatedTask = await prisma.warehouseTask.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
      },
    });

    /*
     * When package becomes ready,
     * notify the rest of the logistics system.
     */

    if (status === "PACKAGE_READY") {
      const event = {
        eventId: randomUUID(),
        eventType: "PACKAGE_READY",
        version: 1,
        occurredAt: new Date().toISOString(),
        data: {
          taskId: updatedTask.id,
          productId: updatedTask.productId,
          warehouseId: updatedTask.warehouseId,
          quantity: updatedTask.quantity,
        },
      };

      await producer.send({
        topic: "warehouse-events",
        messages: [
          {
            value: JSON.stringify(event),
          },
        ],
      });

      console.log("🚚 PACKAGE_READY event published");
    }

    res.json(updatedTask);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update warehouse task",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Warehouse Service running on port ${PORT}`);
});

startKafka().catch((error) => {
  console.error("Failed to start Kafka:", error);
});
