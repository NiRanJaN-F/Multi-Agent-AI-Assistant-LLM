// models/Board.js

const mongoose = require('mongoose');

const { Schema } = mongoose;

// Default Kanban columns
const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

/**
 * Board Schema
 * Represents a Kanban board within a workspace.
 *
 * Fields:
 * - title: Human‑readable board name (required, 3-100 chars).
 * - workspace: Reference to the owning Workspace (required).
 * - columns: Ordered list of column names (default to standard Kanban columns).
 * - createdAt / updatedAt: Timestamps automatically managed by Mongoose.
 */
const BoardSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      minlength: [3, 'Board title must be at least 3 characters'],
      maxlength: [100, 'Board title cannot exceed 100 characters'],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace reference is required'],
    },
    columns: {
      type: [String],
      default: DEFAULT_COLUMNS,
      validate: {
        validator: function (arr) {
          // Ensure at least one column and no duplicates
          return Array.isArray(arr) && arr.length > 0 && new Set(arr).size === arr.length;
        },
        message: 'Columns must be a non‑empty array of unique strings',
      },
    },
  },
  {
    timestamps: true,
    collection: 'boards',
  }
);

// Ensure that the board title is unique within a workspace
BoardSchema.index({ title: 1, workspace: 1 }, { unique: true });

/**
 * Pre‑save hook to normalize column names (trim and capitalize first letter).
 */
BoardSchema.pre('save', function (next) {
  if (this.columns && Array.isArray(this.columns)) {
    this.columns = this.columns.map((col) => {
      const trimmed = col.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
  }
  next();
});

/**
 * Static method to fetch a board by ID with populated workspace and cards.
 * @param {String} boardId
 * @returns {Promise<Board>}
 */
BoardSchema.statics.findWithDetails = async function (boardId) {
  return this.findById(boardId)
    .populate('workspace', 'name')
    .populate({
      path: 'cards',
      select: 'title description column',
    })
    .exec();
};

module.exports = mongoose.model('Board', BoardSchema);