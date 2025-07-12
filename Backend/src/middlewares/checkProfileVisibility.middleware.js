import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkProfileVisibility = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  const requestingUser = req.user;

  // If no username in params, continue
  if (!username) {
    return next();
  }

  const targetUser = await User.findOne({ username });

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // Store the target user's visibility status
  req.profileVisibility = targetUser.visibility;
  req.isOwnProfile = requestingUser && requestingUser.username === username;

  // If the profile is private and it's not the owner viewing it
  if (targetUser.visibility === "private" && !req.isOwnProfile) {
    req.limitedProfile = true;
  } else {
    req.limitedProfile = false;
  }

  next();
});
