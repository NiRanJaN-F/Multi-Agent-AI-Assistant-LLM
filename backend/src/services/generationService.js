import mongoose from "mongoose";
import { Generation } from "../models/Generation.js";

const LIST_PROJECTION =
  "userId prompt projectName provider status techStack llm durationMs mode changedFiles createdAt";

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

/**
 * Persist a generation run.
 * @param {object} record  - Generation fields. Include `userId` when the request is authenticated.
 */
export async function saveGeneration(record) {
  if (!isDatabaseReady()) {
    return { persisted: false, reason: "MongoDB is not connected" };
  }

  const document = await Generation.create(record);
  return { persisted: true, id: document.id };
}

/**
 * List generations. When `userId` is provided results are scoped to that user.
 * Anonymous callers receive an empty list (no cross-user leakage).
 */
export async function listGenerations({ limit = 20, skip = 0, userId } = {}) {
  if (!userId) {
    return { total: 0, limit: 20, skip: 0, items: [] };
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeSkip = Math.max(Number(skip) || 0, 0);
  const filter = { userId };

  const [items, total] = await Promise.all([
    Generation.find(filter, LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(safeSkip)
      .limit(safeLimit)
      .lean(),
    Generation.countDocuments(filter),
  ]);

  return {
    total,
    limit: safeLimit,
    skip: safeSkip,
    items: items.map(({ _id, userId: uid, ...rest }) => ({
      id: String(_id),
      userId: uid ? String(uid) : null,
      ...rest,
    })),
  };
}

/**
 * Fetch a single generation by id, verifying ownership.
 * Returns null when the record does not exist OR belongs to another user.
 */
export async function getGenerationById(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const document = await Generation.findById(id).lean();

  if (!document) return null;

  // Ownership check: legacy records (userId == null) are only visible to
  // anonymous callers. Authenticated callers must own the record.
  if (userId) {
    if (document.userId && String(document.userId) !== String(userId)) {
      return null; // Return 404-equivalent — don't reveal existence
    }
  } else {
    if (document.userId) {
      return null; // Anonymous caller can't see auth-owned records
    }
  }

  const { _id, __v, ...rest } = document;
  return { id: String(_id), ...rest };
}

/**
 * Delete a generation by id, verifying ownership.
 * Returns false when the record does not exist or does not belong to the caller.
 */
export async function deleteGenerationById(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const document = await Generation.findById(id).select("userId").lean();
  if (!document) return false;

  // Ownership check
  if (userId) {
    if (document.userId && String(document.userId) !== String(userId)) {
      return false;
    }
  } else {
    if (document.userId) {
      return false;
    }
  }

  const result = await Generation.findByIdAndDelete(id);
  return Boolean(result);
}
