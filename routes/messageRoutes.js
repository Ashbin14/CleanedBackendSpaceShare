import express from "express";
import User from "../models/user.js";

import authenticate from "./middleware/authUser.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", authenticate, getUsersForSidebar);
router.get("/:id", authenticate, getMessages);

router.post("/send/:id", authenticate, sendMessage);

// routes/messageRoutes.js
router.post("/initiate", authenticate, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Check if there's any existing message between these users
    const existingMessage = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    // If no existing message, create an empty one to establish the connection
    if (!existingMessage) {
      await Message.create({
        senderId,
        receiverId,
        message: "", // or some default message like "Chat initiated"
      });
    }

    res.status(200).json({ message: "Chat initiated successfully" });
  } catch (error) {
    console.error("Error initiating chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
