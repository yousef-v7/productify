import type { Request, Response } from "express";
import { z } from "zod";
import * as queries from "../db/queries";
import { DB_Sync_User } from "../utils/DB_Sync_User";

// --------------------
// Zod Schemas
// --------------------

const idParamSchema = z.object({
  id: z.string().min(1, "Id is required"),
});

const createProductSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    imageUrl: z.string().url("Invalid imageUrl"),
  })
  .strict();

const updateProductSchema = z
  .object({
    title: z.string().min(1).optional(), // ✅ fixed
    description: z.string().min(1).optional(),
    imageUrl: z.string().url("Invalid imageUrl").optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

// --------------------
// Error helper
// --------------------

function handleError(res: Response, error: unknown, fallbackMessage: string) {
  const err = error as { status?: number; message?: string };
  const status = err.status ?? 500;

  if (status !== 500) {
    return res.status(status).json({ error: err.message ?? fallbackMessage });
  }

  console.error(fallbackMessage + ":", error);
  return res.status(500).json({ error: fallbackMessage });
}

// --------------------
// Controllers
// --------------------

// Get all products (public)
export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await queries.getAllProducts();
    return res.status(200).json({ data: products });
  } catch (error) {
    return handleError(res, error, "Failed to get products");
  }
};

// Get products by current user (protected)
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const { userId } = await DB_Sync_User(req);

    const products = await queries.getProductsByUserId(userId);
    return res.status(200).json({ data: products });
  } catch (error) {
    return handleError(res, error, "Failed to get user products");
  }
};

// Get single product by ID (public)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const { id } = parsedParams.data;

    const product = await queries.getProductById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    return res.status(200).json({ data: product });
  } catch (error) {
    return handleError(res, error, "Failed to get product");
  }
};

// Create product (protected)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = await DB_Sync_User(req);

    const parsedBody = createProductSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      });
    }

    const { title, description, imageUrl } = parsedBody.data;

    const product = await queries.createProduct({
      title,
      description,
      imageUrl,
      userId,
    });

    return res.status(201).json({ data: product });
  } catch (error) {
    return handleError(res, error, "Failed to create product");
  }
};

// Update product (protected - owner of product OR owner of site)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { userId, isOwnerSite } = await DB_Sync_User(req); // ✅ get isOwnerSite

    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const parsedBody = updateProductSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      });
    }

    const { id } = parsedParams.data;

    const existingProduct = await queries.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const isOwnerProduct = existingProduct.userId === userId;

    // ✅ السماح: صاحب المنتج أو Owner الموقع
    if (!isOwnerProduct && !isOwnerSite) {
      return res
        .status(403)
        .json({ error: "You can only update your own products" });
    }

    const product = await queries.updateProduct(id, parsedBody.data);
    return res.status(200).json({ data: product });
  } catch (error) {
    return handleError(res, error, "Failed to update product");
  }
};

// Delete product (protected - owner of product OR owner of site)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { userId, isOwnerSite } = await DB_Sync_User(req); // ✅ get isOwnerSite

    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const { id } = parsedParams.data;

    const existingProduct = await queries.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const isOwnerProduct = existingProduct.userId === userId;

    if (!isOwnerProduct && !isOwnerSite) {
      return res
        .status(403)
        .json({ error: "You can only delete your own products" });
    }

    await queries.deleteProduct(id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Failed to delete product");
  }
};
