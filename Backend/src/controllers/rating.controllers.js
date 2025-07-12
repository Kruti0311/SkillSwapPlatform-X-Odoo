import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Rating } from "../models/rating.model.js";
import { User } from "../models/user.model.js";
import { Request } from "../models/request.model.js";

// Create a rating for a completed swap
export const createRating = asyncHandler(async (req, res) => {
  console.log("\n******** Inside createRating Controller function ********");

  const { requestId, rating, comment, skillRated } = req.body;
  const raterId = req.user._id;

  if (!requestId || !rating || !skillRated) {
    throw new ApiError(400, "Request ID, rating, and skill rated are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Check if the request exists and is completed
  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "Completed") {
    throw new ApiError(400, "Can only rate completed swaps");
  }

  // Check if the user is part of this swap
  if (request.sender.toString() !== raterId.toString() && request.receiver.toString() !== raterId.toString()) {
    throw new ApiError(403, "You can only rate swaps you participated in");
  }

  // Determine who is being rated
  const ratedId = request.sender.toString() === raterId.toString() ? request.receiver : request.sender;

  // Check if rating already exists
  const existingRating = await Rating.findOne({ rater: raterId, requestId: requestId });
  if (existingRating) {
    throw new ApiError(400, "You have already rated this swap");
  }

  // Create the rating
  const newRating = await Rating.create({
    rater: raterId,
    rated: ratedId,
    requestId: requestId,
    rating: rating,
    comment: comment || "",
    skillRated: skillRated,
  });

  if (!newRating) {
    throw new ApiError(500, "Error creating rating");
  }

  // Update the rated user's average rating
  await updateUserRating(ratedId);

  res.status(201).json(new ApiResponse(201, newRating, "Rating created successfully"));
});

// Get ratings for a user
export const getUserRatings = asyncHandler(async (req, res) => {
  console.log("\n******** Inside getUserRatings Controller function ********");

  const { username } = req.params;

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const ratings = await Rating.find({ rated: user._id })
    .populate("rater", "username name picture")
    .populate("requestId", "offeredSkill requestedSkill")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, ratings, "Ratings fetched successfully"));
});

// Get ratings given by a user
export const getRatingsGiven = asyncHandler(async (req, res) => {
  console.log("\n******** Inside getRatingsGiven Controller function ********");

  const raterId = req.user._id;

  const ratings = await Rating.find({ rater: raterId })
    .populate("rated", "username name picture")
    .populate("requestId", "offeredSkill requestedSkill")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, ratings, "Ratings fetched successfully"));
});

// Update a rating
export const updateRating = asyncHandler(async (req, res) => {
  console.log("\n******** Inside updateRating Controller function ********");

  const { ratingId } = req.params;
  const { rating, comment } = req.body;
  const raterId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Valid rating is required");
  }

  const existingRating = await Rating.findOne({ _id: ratingId, rater: raterId });
  if (!existingRating) {
    throw new ApiError(404, "Rating not found or you don't have permission to update it");
  }

  const updatedRating = await Rating.findByIdAndUpdate(
    ratingId,
    { rating: rating, comment: comment || "" },
    { new: true }
  );

  // Update the rated user's average rating
  await updateUserRating(existingRating.rated);

  res.status(200).json(new ApiResponse(200, updatedRating, "Rating updated successfully"));
});

// Delete a rating
export const deleteRating = asyncHandler(async (req, res) => {
  console.log("\n******** Inside deleteRating Controller function ********");

  const { ratingId } = req.params;
  const raterId = req.user._id;

  const existingRating = await Rating.findOne({ _id: ratingId, rater: raterId });
  if (!existingRating) {
    throw new ApiError(404, "Rating not found or you don't have permission to delete it");
  }

  await Rating.findByIdAndDelete(ratingId);

  // Update the rated user's average rating
  await updateUserRating(existingRating.rated);

  res.status(200).json(new ApiResponse(200, null, "Rating deleted successfully"));
});

// Helper function to update user's average rating
const updateUserRating = async (userId) => {
  const ratings = await Rating.find({ rated: userId });
  
  if (ratings.length === 0) {
    await User.findByIdAndUpdate(userId, { rating: 0, totalRatings: 0 });
    return;
  }

  const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const averageRating = totalRating / ratings.length;

  await User.findByIdAndUpdate(userId, { 
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    totalRatings: ratings.length 
  });
};
