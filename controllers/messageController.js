import User from "../models/user.js";
import Message from "../models/message.js";
import mongoose from "mongoose"; // Add this import
import { getReceiverSocketId, io } from "../socket/socketHandler.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    console.log("here");
    const loggedInUserId = req.user._id;
    console.log(req.user);
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({
        error: "Invalid user ID format",
        details: {
          userToChatId,
          myId,
          userToChatIdValid: false,
          myIdValid: mongoose.Types.ObjectId.isValid(myId),
        },
      });
    }

    // Convert to ObjectId
    const myObjectId = new mongoose.Types.ObjectId(myId);
    const userToChatObjectId = new mongoose.Types.ObjectId(userToChatId);

    const messages = await Message.find({
      $or: [
        { senderId: myObjectId, receiverId: userToChatObjectId },
        { senderId: userToChatObjectId, receiverId: myObjectId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// In messageController.js
export const getChatList = async (req, res) => {
  try {
    // Use req.user.userId since that's what your auth middleware sets
    // const { id: userToChatId } = req.params;
    const userId = req.user.userId;
    console.log("hello", userId);
    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    // Get unique conversation partners
    const conversationPartners = new Set();
    const uniqueConversations = [];

    messages.forEach((message) => {
      const partnerId =
        message.senderId === userId ? message.receiverId : message.senderId;

      if (!conversationPartners.has(partnerId)) {
        conversationPartners.add(partnerId);
        uniqueConversations.push(message);
      }
    });

    res.json(uniqueConversations);
  } catch (error) {
    console.error("Error in getChatList:", error);
    res.status(500).json({ error: "Error fetching chat list" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;

    // Debug logging
    console.log("Request body:", req.body);
    console.log("Request params:", req.params);
    console.log("User object:", req.user);

    // Validate receiverId
    if (!receiverId || receiverId.trim() === "") {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Validate user authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const senderId = req.user.userId;

    // Create and save the message
    const newMessage = new Message({
      senderId,
      receiverId: receiverId.trim(), // Remove any whitespace
      text,
    });

    await newMessage.save();

    // Socket emission
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error);
    console.log("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};
