import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    res.status(500).json({
      message: "Failed to fetch warehouses",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({
        message: "Warehouse name is required and must be under 100 characters",
      });
    }

    if (!location || typeof location !== "string" || location.trim().length === 0 || location.length > 200) {
      return res.status(400).json({
        message: "Warehouse location is required and must be under 200 characters",
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        location: location.trim(),
      },
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    res.status(500).json({
      message: "Failed to create warehouse",
    });
  }
});

export default router;