import { Router } from "express";
import { UserDetails } from "../controllers/user.controllers.js";
import { verifyJWT_email, verifyJWT_username, isAdmin } from "../middlewares/verifyJWT.middleware.js";
import { checkProfileVisibility } from "../middlewares/checkProfileVisibility.middleware.js";
import {
  UnRegisteredUserDetails,
  saveRegUnRegisteredUser,
  saveEduUnRegisteredUser,
  saveAddUnRegisteredUser,
  registerUser,
  userDetailsWithoutID,
  saveRegRegisteredUser,
  saveEduRegisteredUser,
  saveAddRegisteredUser,
  uploadPic,
  discoverUsers,
  sendScheduleMeet,
  updateProfileVisibility,
  createRequest
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// save and register unregistered user details
router.route("/unregistered/getDetails").get(verifyJWT_email, UnRegisteredUserDetails);
router.route("/unregistered/saveRegDetails").post(verifyJWT_email, saveRegUnRegisteredUser);
router.route("/unregistered/saveEduDetail").post(verifyJWT_email, saveEduUnRegisteredUser);
router.route("/unregistered/saveAddDetail").post(verifyJWT_email, saveAddUnRegisteredUser);
router.route("/registerUser").post(verifyJWT_email, registerUser);

// update user details
router.route("/registered/saveRegDetails").post(verifyJWT_username, saveRegRegisteredUser);
router.route("/registered/saveEduDetail").post(verifyJWT_username, saveEduRegisteredUser);
router.route("/registered/saveAddDetail").post(verifyJWT_username, saveAddRegisteredUser);

// Upload Picture
router.route("/uploadPicture").post(verifyJWT_username, upload.fields([{ name: "picture", maxCount: 1 }]), uploadPic);

// get user details - updated with visibility middleware
router.route("/registered/getDetails/:username").get(verifyJWT_username, checkProfileVisibility, UserDetails);
router.route("/registered/getDetails").get(verifyJWT_username, userDetailsWithoutID);

// update profile visibility
router.route("/updateVisibility").patch(verifyJWT_username, updateProfileVisibility);

// get profiles for discover page
router.route("/discover").get(verifyJWT_username, discoverUsers);

// send schedule meet email
router.route("/sendScheduleMeet").post(verifyJWT_username, sendScheduleMeet);

// ADMIN ENDPOINTS
router.route("/admin/users").get(verifyJWT_username, isAdmin, async (req, res) => {
  const users = await (await import("../models/user.model.js")).User.find();
  res.json(users);
});

// Temporary endpoint to make a user admin (for testing)
router.route("/admin/make-admin/:username").patch(verifyJWT_username, async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const user = await User.findOneAndUpdate(
    { username: req.params.username }, 
    { isAdmin: true }, 
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User made admin", user });
});

router.route("/admin/ban/:username").patch(verifyJWT_username, isAdmin, async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const user = await User.findOneAndUpdate({ username: req.params.username }, { banned: true }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User banned", user });
});

router.route("/admin/unban/:username").patch(verifyJWT_username, isAdmin, async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const user = await User.findOneAndUpdate({ username: req.params.username }, { banned: false }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User unbanned", user });
});

router.route("/admin/rejectSkill/:username").patch(verifyJWT_username, isAdmin, async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const { skill } = req.body;
  const user = await User.findOneAndUpdate(
    { username: req.params.username },
    { $pull: { skillsProficientAt: skill } },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: `Skill '${skill}' rejected`, user });
});

router.route("/admin/swaps").get(verifyJWT_username, isAdmin, async (req, res) => {
  const { Request } = await import("../models/request.model.js");
  const { User } = await import("../models/user.model.js");
  const swaps = await Request.find()
    .populate('sender', 'username name')
    .populate('receiver', 'username name')
    .sort({ updatedAt: -1 });
  res.json(swaps);
});

router.route("/admin/swaps/:id").patch(verifyJWT_username, isAdmin, async (req, res) => {
  const { Request } = await import("../models/request.model.js");
  const { status } = req.body;
  const swap = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!swap) return res.status(404).json({ message: "Swap not found" });
  res.json({ message: `Swap status updated to ${status}`, swap });
});

// Platform-wide message (to be implemented)
// router.route("/admin/message").post(verifyJWT_username, isAdmin, ...);

export default router;
