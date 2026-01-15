import type { Request, Response } from "express";
import { z } from "zod";
import * as queries from "../db/queries";
import { DB_Sync_User } from "../utils/DB_Sync_User";

// --------------------
// Zod Schemas
// --------------------

const productIdParamSchema = z.object({
  productId: z.string().min(1, "productId is required"),
});

const commentIdParamSchema = z.object({
  commentId: z.string().min(1, "commentId is required"),
});

const createCommentSchema = z
  .object({
    content: z.string().min(1, "Comment content is required"),
  })
  .strict();

const updateCommentSchema = z
  .object({
    content: z.string().min(1, "Comment content is required"),
  })
  .strict();

// --------------------
// Error handler
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

// Create comment (protected)
export const createComment = async (req: Request, res: Response) => {
  try {
    const { userId } = await DB_Sync_User(req);

    const parsedParams = productIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const parsedBody = createCommentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      });
    }

    const { productId } = parsedParams.data;
    const { content } = parsedBody.data;

    // verify product exists
    const product = await queries.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const comment = await queries.createComment({
      content,
      userId,
      productId,
    });

    return res.status(201).json({ data: comment });
  } catch (error) {
    return handleError(res, error, "Failed to create comment");
  }
};

// Update comment (protected - owner of comment OR owner of site)
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { userId, isOwnerSite } = await DB_Sync_User(req); // ✅ add isOwnerSite

    const parsedParams = commentIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const parsedBody = updateCommentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      });
    }

    const { commentId } = parsedParams.data;
    const { content } = parsedBody.data;

    const existingComment = await queries.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const isOwnerComment = existingComment.userId === userId;

    // ✅ allow: comment owner OR site owner
    if (!isOwnerComment && !isOwnerSite) {
      return res
        .status(403)
        .json({ error: "You can only update your own comments" });
    }

    const updatedComment = await queries.updateComment(commentId, { content });

    return res.status(200).json({ data: updatedComment });
  } catch (error) {
    return handleError(res, error, "Failed to update comment");
  }
};

// Delete comment (protected - owner of comment OR owner of site)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { userId, isOwnerSite } = await DB_Sync_User(req); // ✅ add isOwnerSite

    const parsedParams = commentIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid params",
        details: parsedParams.error.flatten(),
      });
    }

    const { commentId } = parsedParams.data;

    const existingComment = await queries.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const isOwnerComment = existingComment.userId === userId;

    // ✅ allow: comment owner OR site owner
    if (!isOwnerComment && !isOwnerSite) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await queries.deleteComment(commentId);
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Failed to delete comment");
  }
};
