import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  createReport,
  generateUserActivityReport,
  generateFeedbackReport,
  generateSwapStatsReport,
  generatePlatformReport
} from "../controllers/report.controllers.js";

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
router.post("/", verifyJWT_username, createReport);

// Admin routes (require admin privileges)
router.get("/admin/user-activity", verifyJWT_username, isAdmin, generateUserActivityReport);
router.get("/admin/feedback", verifyJWT_username, isAdmin, generateFeedbackReport);
router.get("/admin/swap-stats", verifyJWT_username, isAdmin, generateSwapStatsReport);
router.get("/admin/platform", verifyJWT_username, isAdmin, generatePlatformReport);

export default router;
