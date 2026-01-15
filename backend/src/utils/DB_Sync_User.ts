//? this file for syncing and validating user from Clerk auth to your database

import type { Request } from "express";
import { getAuth } from "@clerk/express";
import * as queries from "../db/queries";

type HttpError = Error & { status?: number };

function httpError(status: number, message: string): HttpError {
  const err: HttpError = new Error(message);
  err.status = status;
  return err;
}

export async function DB_Sync_User(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw httpError(401, "Unauthorized");
  }

  const user = await queries.getUserById(userId);
  if (!user) {
    throw httpError(403, "User is not synced with database");
  }

  // ===============================
  // ✅ OWNER DETECTION (FUTURE-PROOF)
  // ===============================

  const ownerUserId = process.env.OWNER_USER_ID;
  const ownerEmail = process.env.OWNER_SITE_EMAIL;

  let isOwnerSite = false;

  // 1️⃣ best: OWNER_USER_ID
  if (ownerUserId) {
    isOwnerSite = ownerUserId === userId;
  }
  // 2️⃣ fallback: OWNER_SITE_EMAIL
  else if (ownerEmail && user.email) {
    isOwnerSite =
      ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
  }

  return { userId, user, isOwnerSite };
}
