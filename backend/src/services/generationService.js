import mongoose from "mongoose";
import { Generation } from "../models/Generation.js";

const LIST_PROJECTION =
  "prompt projectName provider status techStack llm durationMs mode changedFiles createdAt";

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function saveGeneration(record) {
  if (!isDatabaseReady()) {
    return { persisted: false, reason: "MongoDB is not connected" };
  }

  const document = await Generation.create(record);
  return { persisted: true, id: document.id };
}

export async function listGenerations({ limit = 20, skip = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeSkip = Math.max(Number(skip) || 0, 0);

  const [items, total] = await Promise.all([
    Generation.find({}, LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(safeSkip)
      .limit(safeLimit)
      .lean(),
    Generation.countDocuments(),
  ]);

  return {
    total,
    limit: safeLimit,
    skip: safeSkip,
    items: items.map(({ _id, ...rest }) => ({ id: String(_id), ...rest })),
  };
}

export async function getGenerationById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const document = await Generation.findById(id).lean();

  if (!document) {
    return null;
  }

  const { _id, __v, ...rest } = document;
  return { id: String(_id), ...rest };
}

export async function deleteGenerationById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const result = await Generation.findByIdAndDelete(id);
  return Boolean(result);
}
