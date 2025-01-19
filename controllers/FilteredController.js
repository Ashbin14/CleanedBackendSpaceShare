import FilteredUsers from "../models/FilteredUser.js";
import Message from "../models/message.js";

export const updateFilteredUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.body;
    const interactionType = req.body.type || "selected";

    // Find or create filtered users document for logged in user
    let filteredUsers = await FilteredUsers.findOne({ userId: loggedInUserId });

    if (!filteredUsers) {
      filteredUsers = new FilteredUsers({
        userId: loggedInUserId,
        filteredUsers: [],
      });
    }

    // Check if user already exists in filtered users
    const existingUserIndex = filteredUsers.filteredUsers.findIndex(
      (fu) => fu.user.toString() === targetUserId
    );

    if (existingUserIndex > -1) {
      // Update last interaction
      filteredUsers.filteredUsers[existingUserIndex].lastInteraction =
        new Date();
      filteredUsers.filteredUsers[existingUserIndex].interactionType =
        interactionType;
    } else {
      // Add new user to filtered users
      filteredUsers.filteredUsers.push({
        user: targetUserId,
        interactionType,
      });
    }

    await filteredUsers.save();

    // Populate user details and return
    const populatedFilteredUsers = await FilteredUsers.findOne({
      userId: loggedInUserId,
    }).populate("filteredUsers.user", "firstName lastName images");

    res.status(200).json(populatedFilteredUsers);
  } catch (error) {
    console.error("Error in updateFilteredUsers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFilteredUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get filtered users document
    let filteredUsers = await FilteredUsers.findOne({
      userId: loggedInUserId,
    }).populate("filteredUsers.user", "firstName lastName images");

    if (!filteredUsers) {
      // If no filtered users exist, get users from message history
      const messages = await Message.find({
        $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      }).sort({ createdAt: -1 });

      // Extract unique user IDs
      const userIds = new Set();
      messages.forEach((message) => {
        if (message.senderId.toString() !== loggedInUserId.toString()) {
          userIds.add(message.senderId);
        }
        if (message.receiverId.toString() !== loggedInUserId.toString()) {
          userIds.add(message.receiverId);
        }
      });

      // Create new filtered users document
      filteredUsers = new FilteredUsers({
        userId: loggedInUserId,
        filteredUsers: Array.from(userIds).map((userId) => ({
          user: userId,
          interactionType: "message",
        })),
      });

      await filteredUsers.save();

      // Populate user details
      filteredUsers = await FilteredUsers.findOne({
        userId: loggedInUserId,
      }).populate("filteredUsers.user", "firstName lastName images");
    }

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getFilteredUsers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
