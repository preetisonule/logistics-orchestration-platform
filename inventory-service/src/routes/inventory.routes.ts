import { Router } from "express";
import { createEvent } from "../events/event.js";
import { prisma } from "../lib/prisma.js";
import { parseAutomationMode } from "../utils/automationMode.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { productId, warehouseId, totalQuantity } = req.body;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ message: "Valid productId is required" });
    }
    if (!warehouseId || typeof warehouseId !== "string") {
      return res.status(400).json({ message: "Valid warehouseId is required" });
    }
    if (typeof totalQuantity !== "number" || !Number.isInteger(totalQuantity) || totalQuantity < 0) {
      return res.status(400).json({ message: "totalQuantity must be a non-negative integer" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Referenced product not found" });
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      return res.status(404).json({ message: "Referenced warehouse not found" });
    }

    const existing = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (existing) {
      return res.status(409).json({ message: "Inventory record already exists for this product and warehouse" });
    }

    const inventory = await prisma.inventory.create({
      data: {
        productId,
        warehouseId,
        totalQuantity,
      },
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error("Error creating inventory:", error);
    res.status(500).json({
      message: "Failed to create inventory",
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
});

router.post("/:id/reserve", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, serviceLevel: reqServiceLevel, automationMode: reqAutomationMode } = req.body;

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    const serviceLevel = reqServiceLevel === "EXPRESS" ? "EXPRESS" : "STANDARD";
    const automationMode = parseAutomationMode(reqAutomationMode);

    const updatedInventory = await prisma.$transaction(async (tx) => {
      const result = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedQuantity" = "reservedQuantity" + ${quantity}
        WHERE "id" = ${id}
          AND "totalQuantity" - "reservedQuantity" >= ${quantity}
      `;

      if (result === 0) {
        const inventoryCheck = await tx.inventory.findUnique({ where: { id } });
        if (!inventoryCheck) {
          throw new Error("INVENTORY_NOT_FOUND");
        }
        throw new Error("INSUFFICIENT_INVENTORY");
      }

      const inventory = await tx.inventory.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      const weightKg = inventory.product?.weightKg ?? 1;

      const event = createEvent(
        "INVENTORY_RESERVED",
        "inventory-service",
        {
          inventoryId: inventory.id,
          productId: inventory.productId,
          warehouseId: inventory.warehouseId,
          quantity,
          weightKg,
          serviceLevel,
          automationMode,
        }
      );

      await tx.outboxEvent.create({
        data: {
          eventType: "INVENTORY_RESERVED",
          payload: JSON.stringify(event),
        },
      });

      return inventory;
    });

    return res.status(200).json(updatedInventory);
  } catch (error) {
    console.error("Error reserving inventory:", error);

    if (error instanceof Error) {
      if (error.message === "INVENTORY_NOT_FOUND") {
        return res.status(404).json({
          message: "Inventory not found",
        });
      }

      if (error.message === "INSUFFICIENT_INVENTORY") {
        return res.status(400).json({
          message: "Insufficient inventory",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to reserve inventory",
    });
  }
});

export default router;
