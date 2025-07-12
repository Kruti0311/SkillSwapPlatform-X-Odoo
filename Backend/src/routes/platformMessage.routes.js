import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  createPlatformMessage,
  getAllPlatformMessages,
  getActivePlatformMessages,
  markMessageAsRead,
  updatePlatformMessage,
  deletePlatformMessage,
  getUnreadMessageCount,
} from "../controllers/platformMessage.controllers.js";

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// User routes (require authentication only)
router.get("/", verifyJWT_username, getActivePlatformMessages);
router.post("/:messageId/read", verifyJWT_username, markMessageAsRead);
router.get("/unread-count", verifyJWT_username, getUnreadMessageCount);

// Admin routes (require admin privileges)
router.post("/", verifyJWT_username, isAdmin, createPlatformMessage);
router.get("/admin", verifyJWT_username, isAdmin, getAllPlatformMessages);
router.put("/:messageId", verifyJWT_username, isAdmin, updatePlatformMessage);
router.delete("/:messageId", verifyJWT_username, isAdmin, deletePlatformMessage);

export default router; 