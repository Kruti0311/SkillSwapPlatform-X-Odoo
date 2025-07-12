import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkProfileVisibility = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  const requestingUser = req.user; // Assuming you have user info from auth middleware

  const targetUser = await User.findOne({ username });

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // If the profile is private and it's not the owner viewing it
  if (targetUser.visibility === "private" && (!requestingUser || requestingUser.username !== username)) {
    // Return limited information
    req.limitedProfile = true;
    req.targetUser = {
      username: targetUser.username,
      name: targetUser.name,
      picture: targetUser.picture,
      visibility: targetUser.visibility,
      bio: "This profile is private",
      skills: [],
    };
  } else {
    req.limitedProfile = false;
    req.targetUser = targetUser;
  }

  next();
});
