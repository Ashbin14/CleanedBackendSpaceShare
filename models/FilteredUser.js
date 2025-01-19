import mongoose from "mongoose";

const filteredUsersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filteredUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        lastInteraction: {
          type: Date,
          default: Date.now,
        },
        interactionType: {
          type: String,
          enum: ["message", "selected"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a compound index for userId and 'filteredUsers.user'
filteredUsersSchema.index({ userId: 1, "filteredUsers.user": 1 });

const FilteredUsers = mongoose.model("FilteredUsers", filteredUsersSchema);

export default FilteredUsers;
