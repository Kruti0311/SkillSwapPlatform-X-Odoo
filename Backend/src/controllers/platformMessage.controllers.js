import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PlatformMessage } from "../models/platformMessage.model.js";
import { User } from "../models/user.model.js";

// Create a new platform message (Admin only)
const createPlatformMessage = asyncHandler(async (req, res) => {
  const { title, content, type = "info", priority = "medium", expiresAt } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  const message = await PlatformMessage.create({
    title,
    content,
    type,
    priority,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    sentBy: req.user._id,
  });

  const populatedMessage = await PlatformMessage.findById(message._id).populate("sentBy", "username name");

  return res.status(201).json(
    new ApiResponse(201, populatedMessage, "Platform message created successfully")
  );
});

// Get all platform messages (Admin only)
const getAllPlatformMessages = asyncHandler(async (req, res) => {
  const messages = await PlatformMessage.find()
    .populate("sentBy", "username name")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, messages, "Platform messages retrieved successfully")
  );
});

// Get active platform messages for users
const getActivePlatformMessages = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  
  const messages = await PlatformMessage.find({
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: currentDate } }
    ]
  })
    .populate("sentBy", "username name")
    .sort({ priority: -1, createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, messages, "Active platform messages retrieved successfully")
  );
});

// Mark message as read by user
const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await PlatformMessage.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user already read this message
  const alreadyRead = message.readBy.some(read => read.user.toString() === req.user._id.toString());
  
  if (!alreadyRead) {
    message.readBy.push({
      user: req.user._id,
      readAt: new Date()
    });
    await message.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Message marked as read")
  );
});

// Update platform message (Admin only)
const updatePlatformMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { title, content, type, priority, isActive, expiresAt } = req.body;

  const message = await PlatformMessage.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Update fields if provided
  if (title !== undefined) message.title = title;
  if (content !== undefined) message.content = content;
  if (type !== undefined) message.type = type;
  if (priority !== undefined) message.priority = priority;
  if (isActive !== undefined) message.isActive = isActive;
  if (expiresAt !== undefined) message.expiresAt = expiresAt ? new Date(expiresAt) : null;

  await message.save();

  const updatedMessage = await PlatformMessage.findById(messageId).populate("sentBy", "username name");

  return res.status(200).json(
    new ApiResponse(200, updatedMessage, "Platform message updated successfully")
  );
});

// Delete platform message (Admin only)
const deletePlatformMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await PlatformMessage.findByIdAndDelete(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Platform message deleted successfully")
  );
});

// Get unread message count for user
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  
  const activeMessages = await PlatformMessage.find({
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: currentDate } }
    ]
  });

  let unreadCount = 0;
  
  for (const message of activeMessages) {
    const hasRead = message.readBy.some(read => read.user.toString() === req.user._id.toString());
    if (!hasRead) {
      unreadCount++;
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread message count retrieved successfully")
  );
});

export {
  createPlatformMessage,
  getAllPlatformMessages,
  getActivePlatformMessages,
  markMessageAsRead,
  updatePlatformMessage,
  deletePlatformMessage,
  getUnreadMessageCount,
}; 