import express from "express";
import { prisma } from "./lib/prisma.js";
import {
  InvalidTransitionError,
  TaskNotFoundError,
  TransitionConflictError,
  transitionWarehouseTaskStatus,
  type WarehouseTaskStatus,
} from "./services/taskTransitions.js";

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
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const updatedTask = await transitionWarehouseTaskStatus(
      req.params.id,
      status as WarehouseTaskStatus,
    );

    if (updatedTask.status === "PACKAGE_READY") {
      console.log(
        `[warehouse-service] 🚚 Task ${updatedTask.id} transitioned to PACKAGE_READY. Outbox record created.`,
      );
    }

    return res.json(updatedTask);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return res.status(404).json({ message: "Warehouse task not found" });
    }
    if (error instanceof InvalidTransitionError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof TransitionConflictError) {
      return res.status(409).json({ message: "Task status was updated by another process" });
    }

    console.error("Failed to update task status:", error);
    return res.status(500).json({ message: "Failed to update warehouse task status" });
  }
});
