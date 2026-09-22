import express from "express";
import productRoutes from "./routes/product.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
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

app.use("/products", productRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/inventory", inventoryRoutes);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ service: "inventory-service", status: "ok" });
  } catch {
    res.status(503).json({ service: "inventory-service", status: "error", database: "disconnected" });
  }
});

app.get("/", async (_req, res) => {
  try {
    const productCount = await prisma.product.count();
    res.json({
      service: "inventory-service",
      status: "running",
      database: "connected",
      productCount,
    });
  } catch (error) {
    console.error("Health error:", error);
    res.status(500).json({ service: "inventory-service", status: "error" });
  }
});
