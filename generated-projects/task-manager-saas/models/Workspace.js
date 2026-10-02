// models/Workspace.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Workspace Schema
 * - name: Human readable name of the workspace (required)
 * - owner: User who created the workspace (required)
 * - members: Array of Users that belong to the workspace (owner is implicitly a member)
 * - createdAt / updatedAt: Managed by timestamps option
 */
const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Ensure the owner is always part of the members array.
 */
workspaceSchema.pre('save', function (next) {
  if (!this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  next();
});

/**
 * When a workspace is removed, optionally cascade delete related boards.
 * This is a safety net; actual cascade logic can also be handled in route handlers.
 */
workspaceSchema.pre('remove', async function (next) {
  try {
    const Board = mongoose.model('Board');
    await Board.deleteMany({ workspace: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);