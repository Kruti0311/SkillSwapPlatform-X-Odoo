import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  createRequest,
  getRequests,
  getAllRequests,
  acceptRequest,
  rejectRequest,
  deleteRequest,
  completeSwap,
} from "../controllers/request.controllers.js";

const router = Router();

router.route("/create").post(verifyJWT_username, createRequest);
router.route("/get").get(verifyJWT_username, getRequests);
router.route("/all").get(verifyJWT_username, getAllRequests);
router.route("/accept").post(verifyJWT_username, acceptRequest);
router.route("/reject").post(verifyJWT_username, rejectRequest);
router.route("/delete/:requestId").delete(verifyJWT_username, deleteRequest);
router.route("/complete").post(verifyJWT_username, completeSwap);

export default router;
