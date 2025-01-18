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

    // Debug logs
    console.log("userToChatId:", userToChatId);
    console.log("myId:", myId);
    console.log("req.user:", req.user);
    console.log(
      "Is userToChatId valid:",
      mongoose.Types.ObjectId.isValid(userToChatId)
    );
    console.log("Is myId valid:", mongoose.Types.ObjectId.isValid(myId));

    // First try without immediate validation to see the values
    try {
      // Convert string IDs to ObjectId
      const myObjectId = new mongoose.Types.ObjectId(myId);
      const userToChatObjectId = new mongoose.Types.ObjectId(userToChatId);

      const messages = await Message.find({
        $or: [
          { senderId: myObjectId, receiverId: userToChatObjectId },
          { senderId: userToChatObjectId, receiverId: myObjectId },
        ],
      }).sort({ createdAt: 1 });

      console.log("Retrieved messages:", messages);
      res.status(200).json(messages);
    } catch (idError) {
      console.log("Error converting IDs:", idError);
      res.status(400).json({
        error: "Invalid user ID format",
        details: {
          userToChatId,
          myId,
          userToChatIdValid: mongoose.Types.ObjectId.isValid(userToChatId),
          myIdValid: mongoose.Types.ObjectId.isValid(myId),
        },
      });
    }
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
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
