import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, location } = req.body;

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
      },
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create warehouse",
    });
  }
});

export default router;