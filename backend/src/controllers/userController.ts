import type { Request, Response } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import * as queries from "../db/queries";

// --------------------
// Zod Schema
// --------------------

const syncUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(2).max(20),
    imageUrl: z.string().url(),
  })
  .strict();// no extra fields allowed

// --------------------
// Controller
// --------------------

export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = syncUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const { email, name, imageUrl } = parsed.data;

    // upsert = create user or update if exists
    const user = await queries.upsertUser({
      id: userId,
      email,
      name,
      imageUrl,
    });

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Failed to sync user" });
  }
}
