import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { publishInventoryReserved } from "../kafka/producer.js";

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

    // Atomically reserve inventory
    const result = await prisma.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" + ${quantity}
      WHERE "id" = ${id}
        AND "totalQuantity" - "reservedQuantity" >= ${quantity}
    `;

    // No row updated = either inventory doesn't exist
    // or there wasn't enough available inventory
    if (result === 0) {
      const inventory = await prisma.inventory.findUnique({
        where: {
          id,
        },
      });

      if (!inventory) {
        return res.status(404).json({
          message: "Inventory not found",
        });
      }

      return res.status(400).json({
        message: "Insufficient inventory",
      });
    }

    // Fetch the updated record
    const updatedInventory = await prisma.inventory.findUnique({
  where: {
    id,
  },
});

await publishInventoryReserved({
  inventoryId: updatedInventory!.id,
  productId: updatedInventory!.productId,
  warehouseId: updatedInventory!.warehouseId,
  quantity,
});

return res.status(200).json(updatedInventory);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to reserve inventory",
    });
  }
});

export default router;
