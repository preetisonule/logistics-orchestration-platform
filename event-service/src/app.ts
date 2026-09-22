import express from "express";
import { prisma } from "./lib/prisma.js";

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
    res.json({ service: "event-service", status: "ok" });
  } catch {
    res.status(503).json({ service: "event-service", status: "error", database: "disconnected" });
  }
});

app.get("/events", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const { eventType, source, correlationId } = req.query;

    const whereClause: Record<string, unknown> = {};

    if (typeof eventType === "string" && eventType.trim().length > 0) {
      whereClause.eventType = eventType.trim();
    }
    if (typeof source === "string" && source.trim().length > 0) {
      whereClause.source = source.trim();
    }
    if (typeof correlationId === "string" && correlationId.trim().length > 0) {
      whereClause.correlationId = correlationId.trim();
    }

    const events = await prisma.eventLog.findMany({
      where: whereClause,
      orderBy: {
        occurredAt: "desc",
      },
      take: limit,
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch event logs" });
  }
});
