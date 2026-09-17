import { Router } from "express";
import { createEvent } from "../events/event.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { productId, warehouseId, totalQuantity } = req.body;

    const inventory = await prisma.inventory.create({
      data: {
        productId,
        warehouseId,
        totalQuantity,
      },
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create inventory",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany();

    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
});

router.post("/:id/reserve", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    // Reserve inventory + create outbox event in ONE transaction
    const updatedInventory = await prisma.$transaction(async (tx) => {
      // Atomically reserve inventory
      const result = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedQuantity" = "reservedQuantity" + ${quantity}
        WHERE "id" = ${id}
          AND "totalQuantity" - "reservedQuantity" >= ${quantity}
      `;

      // No row updated = either inventory doesn't exist
      // or there wasn't enough available inventory
      if (result === 0) {
        const inventory = await tx.inventory.findUnique({
          where: {
            id,
          },
        });

        if (!inventory) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        throw new Error("INSUFFICIENT_INVENTORY");
      }

      // Fetch updated inventory
      const inventory = await tx.inventory.findUnique({
        where: {
          id,
        },
      });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      // Create event payload
      const event = createEvent("INVENTORY_RESERVED", {
        inventoryId: inventory.id,
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        quantity,
      });

      // Store event in Outbox
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
    console.error(error);

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
