import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  createRating,
  getUserRatings,
  getRatingsGiven,
  updateRating,
  deleteRating,
} from "../controllers/rating.controllers.js";

const router = Router();

router.route("/create").post(verifyJWT_username, createRating);
router.route("/user/:username").get(verifyJWT_username, getUserRatings);
router.route("/given").get(verifyJWT_username, getRatingsGiven);
router.route("/update/:ratingId").patch(verifyJWT_username, updateRating);
router.route("/delete/:ratingId").delete(verifyJWT_username, deleteRating);

export default router;
