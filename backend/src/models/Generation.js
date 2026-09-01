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
    prompt: { type: String, required: true },
    projectName: { type: String, required: true, index: true },
    provider: { type: String, default: null },
    status: { type: String, default: "completed" },
    techStack: { type: String, default: "" },
    tasks: { type: [String], default: [] },
    savedFiles: { type: [String], default: [] },
    outputDir: { type: String, default: "" },
    reviewResults: { type: mongoose.Schema.Types.Mixed, default: {} },
    documentation: { type: String, default: "" },
    logs: { type: [logEntrySchema], default: [] },
    llm: { type: mongoose.Schema.Types.Mixed, default: {} },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

generationSchema.index({ createdAt: -1 });

export const Generation = mongoose.model("Generation", generationSchema);
