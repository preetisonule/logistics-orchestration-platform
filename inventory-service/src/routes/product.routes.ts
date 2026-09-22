import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, sku, weightKg } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 150) {
      return res.status(400).json({
        message: "Product name is required and must be under 150 characters",
      });
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0 || sku.length > 50) {
      return res.status(400).json({
        message: "Product SKU is required and must be under 50 characters",
      });
    }

    const parsedWeight = weightKg !== undefined ? Number(weightKg) : 1.0;
    if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 1000) {
      return res.status(400).json({
        message: "Weight must be a positive number in kg (max 1000kg)",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
    });

    if (existingProduct) {
      return res.status(409).json({
        message: `Product with SKU '${sku.trim().toUpperCase()}' already exists`,
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        weightKg: parsedWeight,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Failed to create product",
    });
  }
});

export default router;