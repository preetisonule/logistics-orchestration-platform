import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma.js";
import { startConsumer } from "./kafka/consumer.js";

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT);

app.get("/shipments", async (_req, res) => {
  const shipments = await prisma.shipment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(shipments);
});

app.get("/shipments/:trackingNumber", async (req, res) => {
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
});

app.patch("/shipments/:trackingNumber/status", async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "CREATED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid shipment status",
    });
  }

  const shipment = await prisma.shipment.update({
    where: {
      trackingNumber: req.params.trackingNumber,
    },
    data: {
      status,
    },
  });

  res.json(shipment);
});

async function startServer() {
  await startConsumer();

  app.listen(PORT, () => {
    console.log(`🚚 Shipment Service running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Shipment Service failed:", error);
});