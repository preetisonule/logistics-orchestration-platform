import express from "express";
import { prisma } from "./lib/prisma.js";
import { createEvent } from "./events/event.js";
import {
  getWarehouseAutomationStatus,
  setWarehouseAutomationStatus,
} from "./services/automation.js";

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ service: "warehouse-service", status: "ok" });
  } catch {
    res.status(503).json({ service: "warehouse-service", status: "error", database: "disconnected" });
  }
});

app.get("/automation/status", (_req, res) => {
  res.json({ service: "warehouse-service", enabled: getWarehouseAutomationStatus() });
});

app.post("/automation/toggle", (req, res) => {
  const current = getWarehouseAutomationStatus();
  const nextState = typeof req.body.enabled === "boolean" ? req.body.enabled : !current;
  const updated = setWarehouseAutomationStatus(nextState);
  res.json({ service: "warehouse-service", enabled: updated });
});

app.get("/tasks", async (_req, res) => {
  try {
    const tasks = await prisma.warehouseTask.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error("Failed to fetch warehouse tasks:", error);
    res.status(500).json({ message: "Failed to fetch warehouse tasks" });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const task = await prisma.warehouseTask.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Warehouse task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    res.status(500).json({ message: "Failed to fetch warehouse task" });
  }
});

app.patch("/tasks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["PICKING_PENDING", "PICKED", "PACKED", "PACKAGE_READY"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}` });
    }

    const task = await prisma.warehouseTask.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ message: "Warehouse task not found" });
    }

    const validTransition =
      (task.status === "PICKING_PENDING" && status === "PICKED") ||
      (task.status === "PICKED" && status === "PACKED") ||
      (task.status === "PACKED" && status === "PACKAGE_READY");

    if (!validTransition) {
      return res.status(400).json({
        message: `Invalid status transition from ${task.status} to ${status}`,
      });
    }

    if (status === "PACKAGE_READY") {
      // Transactional Outbox Pattern
      const updatedTask = await prisma.$transaction(async (tx) => {
        const updated = await tx.warehouseTask.update({
          where: { id: req.params.id },
          data: { status },
        });

        const packageReadyEvent = createEvent(
          "PACKAGE_READY",
          "warehouse-service",
          {
            taskId: updated.id,
            productId: updated.productId,
            warehouseId: updated.warehouseId,
            quantity: updated.quantity,
            weightKg: updated.weightKg,
            serviceLevel: updated.serviceLevel,
          },
          updated.correlationId || undefined,
          updated.sourceEventId || undefined
        );

        await tx.outboxEvent.create({
          data: {
            eventType: "PACKAGE_READY",
            payload: JSON.stringify(packageReadyEvent),
          },
        });

        return updated;
      });

      console.log(`[warehouse-service] 🚚 Task ${updatedTask.id} transitioned to PACKAGE_READY. Outbox record created.`);
      return res.json(updatedTask);
    } else {
      const updatedTask = await prisma.warehouseTask.update({
        where: { id: req.params.id },
        data: { status },
      });
      return res.json(updatedTask);
    }
  } catch (error) {
    console.error("Failed to update task status:", error);
    res.status(500).json({ message: "Failed to update warehouse task status" });
  }
});
