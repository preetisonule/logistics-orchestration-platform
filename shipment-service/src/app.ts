import express from "express";
import { prisma } from "./lib/prisma.js";
import { createEvent } from "./events/event.js";

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
    res.json({ service: "shipment-service", status: "ok" });
  } catch {
    res.status(503).json({ service: "shipment-service", status: "error", database: "disconnected" });
  }
});

app.get("/shipments", async (_req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(shipments);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ message: "Failed to fetch shipments" });
  }
});

app.get("/shipments/:trackingNumber", async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: {
        trackingNumber: req.params.trackingNumber,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    res.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({ message: "Failed to fetch shipment" });
  }
});

app.patch("/shipments/:trackingNumber/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid shipment status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const shipment = await prisma.shipment.findUnique({
      where: {
        trackingNumber: req.params.trackingNumber,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const validTransition =
      (shipment.status === "CREATED" && status === "IN_TRANSIT") ||
      (shipment.status === "IN_TRANSIT" && status === "OUT_FOR_DELIVERY") ||
      (shipment.status === "OUT_FOR_DELIVERY" && status === "DELIVERED");

    if (!validTransition) {
      return res.status(400).json({
        message: `Invalid status transition from ${shipment.status} to ${status}`,
      });
    }

    const updatedShipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: {
          trackingNumber: req.params.trackingNumber,
        },
        data: {
          status,
        },
      });

      const statusEvent = createEvent(
        "SHIPMENT_STATUS_UPDATED",
        "shipment-service",
        {
          shipmentId: updated.id,
          trackingNumber: updated.trackingNumber,
          previousStatus: shipment.status,
          status: updated.status,
          carrier: updated.carrier,
        },
        updated.correlationId || undefined,
        updated.id
      );

      await tx.outboxEvent.create({
        data: {
          eventType: "SHIPMENT_STATUS_UPDATED",
          payload: JSON.stringify(statusEvent),
        },
      });

      return updated;
    });

    console.log(`[shipment-service] 🚚 Shipment ${updatedShipment.trackingNumber} updated to ${status}. Outbox event created.`);
    res.json(updatedShipment);
  } catch (error) {
    console.error("Error updating shipment status:", error);
    res.status(500).json({ message: "Failed to update shipment status" });
  }
});
