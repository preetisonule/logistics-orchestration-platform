import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma.js";
import productRoutes from "./routes/product.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import { connectProducer } from "./kafka/producer.js";
import { startOutboxPublisher } from "./kafka/outbox-publisher.js";


const app = express();

app.use(express.json());
app.use("/products", productRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/inventory", inventoryRoutes);


app.get("/", async (req, res) => {
  try {
    const productCount = await prisma.product.count();

    res.json({
      service: "Inventory Service",
      status: "running",
      database: "connected",
      productCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      database: "connection failed",
    });
  }
});

const PORT = Number(process.env.PORT);

async function startServer() {
  await connectProducer();

  startOutboxPublisher();

  app.listen(PORT, () => {
    console.log(`Inventory Service running on port ${PORT}`);
  });
}

startServer();