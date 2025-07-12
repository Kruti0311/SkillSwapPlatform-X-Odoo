import mongoose, { Schema } from "mongoose";

const platformMessageSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

// Index for efficient querying
platformMessageSchema.index({ isActive: 1, expiresAt: 1 });
platformMessageSchema.index({ sentBy: 1 });

export const PlatformMessage = mongoose.model("PlatformMessage", platformMessageSchema); 