import mongoose from "mongoose";

const logEntrySchema = new mongoose.Schema(
  {
    agent: String,
    status: String,
    message: String,
    timestamp: String,
  },
  { _id: false },
);

const generationSchema = new mongoose.Schema(
  {
    // Owner — null for anonymous / legacy generations
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    prompt: { type: String, required: true },
    projectName: { type: String, required: true, index: true },
    provider: { type: String, default: null },
    status: { type: String, default: "completed" },
    techStack: { type: String, default: "" },
    tasks: { type: [String], default: [] },
    savedFiles: { type: [String], default: [] },
    changedFiles: { type: [String], default: [] },
    files: { type: mongoose.Schema.Types.Mixed, default: {} },
    mode: { type: String, enum: ["generate", "refine"], default: "generate" },
    outputDir: { type: String, default: "" },
    reviewResults: { type: mongoose.Schema.Types.Mixed, default: {} },
    documentation: { type: String, default: "" },
    logs: { type: [logEntrySchema], default: [] },
    llm: { type: mongoose.Schema.Types.Mixed, default: {} },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Per-user reverse-chronological history — most common query pattern
generationSchema.index({ userId: 1, createdAt: -1 });
generationSchema.index({ createdAt: -1 });

export const Generation = mongoose.model("Generation", generationSchema);
