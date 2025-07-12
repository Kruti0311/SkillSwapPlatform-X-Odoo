import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { Request } from "../models/request.model.js";
import { Chat } from "../models/chat.model.js";

export const createRequest = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside createRequest Controller function ********");

  const { receiverID, offeredSkill, requestedSkill, message } = req.body;
  const senderID = req.user._id;

  console.log("Sender ID: ", senderID);
  console.log("Receiver ID: ", receiverID);

  if (!offeredSkill || !requestedSkill) {
    throw new ApiError(400, "Offered skill and requested skill are required");
  }

  const existingRequest = await Request.find({ sender: senderID, receiver: receiverID });

  if (existingRequest.length > 0) {
    throw new ApiError(400, "Request already exists");
  }

  const receiver = await Request.create({
    sender: senderID,
    receiver: receiverID,
    offeredSkill,
    requestedSkill,
    message: message || "",
  });

  if (!receiver) return next(new ApiError(500, "Request not created"));

  res.status(201).json(new ApiResponse(201, receiver, "Request created successfully"));
});

export const getRequests = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside getRequests Controller function ********");

  const receiverID = req.user._id;

  const requests = await Request.find({ receiver: receiverID, status: "Pending" }).populate("sender");

  if (requests.length > 0) {
    const sendersDetails = requests.map((request) => {
      return request._doc.sender;
    });
    return res.status(200).json(new ApiResponse(200, sendersDetails, "Requests fetched successfully"));
  }

  return res.status(200).json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

// Get all requests (sent and received) for a user
export const getAllRequests = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside getAllRequests Controller function ********");

  const userID = req.user._id;

  const sentRequests = await Request.find({ sender: userID }).populate("receiver", "username name picture");
  const receivedRequests = await Request.find({ receiver: userID }).populate("sender", "username name picture");

  return res.status(200).json(new ApiResponse(200, {
    sent: sentRequests,
    received: receivedRequests
  }, "All requests fetched successfully"));
});

export const acceptRequest = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside acceptRequest Controller function ********");

  const { requestId } = req.body;
  const senderId = req.user._id;

  // console.log("RequestId: ", requestId);
  // console.log("Sender ID: ", senderId);

  const existingRequest = await Request.find({ sender: requestId, receiver: senderId });

  // console.log("Existing Request: ", existingRequest);

  if (existingRequest.length === 0) {
    throw new ApiError(400, "Request does not exist");
  }

  const existingChat = await Chat.find({ users: { $all: [requestId, senderId] } });

  if (existingChat.length > 0) {
    throw new ApiError(400, "Chat already exists");
  }

  const chat = await Chat.create({
    users: [requestId, senderId],
  });

  if (!chat) return next(new ApiError(500, "Chat not created"));

  await Request.findOneAndUpdate(
    { sender: requestId, receiver: senderId },
    {
      status: "Connected",
    }
  );

  res.status(201).json(new ApiResponse(201, chat, "Request accepted successfully"));
});

export const rejectRequest = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside rejectRequest Controller function ********");

  const { requestId } = req.body;
  const senderId = req.user._id;

  // console.log("RequestId: ", requestId);
  // console.log("Sender ID: ", senderId);

  const existingRequest = await Request.find({ sender: requestId, receiver: senderId, status: "Pending" });

  // console.log("Existing Request: ", existingRequest);

  if (existingRequest.length === 0) {
    throw new ApiError(400, "Request does not exist");
  }

  await Request.findOneAndUpdate({ sender: requestId, receiver: senderId }, { status: "Rejected" });

  res.status(200).json(new ApiResponse(200, null, "Request rejected successfully"));
});

// Delete a request (only if it's pending and you're the sender)
export const deleteRequest = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside deleteRequest Controller function ********");

  const { requestId } = req.params;
  const senderId = req.user._id;

  const existingRequest = await Request.findOne({ 
    _id: requestId, 
    sender: senderId, 
    status: "Pending" 
  });

  if (!existingRequest) {
    throw new ApiError(400, "Request not found or cannot be deleted");
  }

  await Request.findByIdAndDelete(requestId);

  res.status(200).json(new ApiResponse(200, null, "Request deleted successfully"));
});

// Mark a swap as completed
export const completeSwap = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside completeSwap Controller function ********");

  const { requestId } = req.body;
  const userId = req.user._id;

  const existingRequest = await Request.findOne({ 
    _id: requestId, 
    $or: [{ sender: userId }, { receiver: userId }],
    status: "Connected"
  });

  if (!existingRequest) {
    throw new ApiError(400, "Request not found or not in connected status");
  }

  await Request.findByIdAndUpdate(requestId, { status: "Completed" });

  res.status(200).json(new ApiResponse(200, null, "Swap marked as completed successfully"));
});
