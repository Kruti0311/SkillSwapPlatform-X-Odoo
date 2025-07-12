import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    rater: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rated: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    requestId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Request",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    skillRated: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure one rating per user per request
ratingSchema.index({ rater: 1, requestId: 1 }, { unique: true });

export const Rating = mongoose.model("Rating", ratingSchema);
