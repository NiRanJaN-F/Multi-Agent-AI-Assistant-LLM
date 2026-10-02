// models/Card.js

const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the Card schema with validation and timestamps
const CardSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character long'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    column: {
      type: String,
      required: [true, 'Column is required'],
      trim: true,
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board reference is required'],
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
    collection: 'cards',
  }
);

// Indexes for efficient queries
CardSchema.index({ board: 1, column: 1 });
CardSchema.index({ title: 'text', description: 'text' });

// Static method to fetch all cards for a specific board
CardSchema.statics.findByBoard = function (boardId) {
  return this.find({ board: boardId }).sort({ createdAt: -1 }).exec();
};

// Instance method to move a card to a different column
CardSchema.methods.moveToColumn = function (newColumn) {
  this.column = newColumn;
  return this.save();
};

// Export the Card model
module.exports = mongoose.model('Card', CardSchema);