import express from "express";
import { spaceController } from "../controllers/spaceController.js";
import { upload } from "../config/multerconfig.js"; // Multer config
import authenticateuser from "./middleware/authUser.js"; // JWT authentication middleware'
import mongoose from "mongoose";
import { Space } from "../models/space.js";
import User from "../models/user.js";
import { userInfo } from "os";

const router = express.Router();
router.post(
  "/post",
  authenticateuser,
  upload.array("images", 5),
  spaceController.createSpace
);
router.get("/get", authenticateuser, spaceController.getSpaces);
router.get("/:id", spaceController.getSpaceById);
router.patch(
  "/:id",
  authenticateuser,
  upload.array("images", 5),
  spaceController.updateSpace
);
router.delete("/:id", authenticateuser, spaceController.deleteSpace);
router.post("/dealdone", authenticateuser, async (req, res) => {
  const { spaceId } = req.body;
  try {
    const space = await Space.findById(spaceId);
    if (req.user.userId != space.userId)
      return res.status(200).json({
        success: false,
        message: "property doesnot belongs to the user and cannot edit it",
      });
    if (space) {
      space.booked = true;
    }

    return res.status(200).json({
      success: true,
      space: { space },
      message: "the flat is booked change the colour",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while changing the staus",
      error: error.message,
    });
  }
});
router.post("/dealcancled", authenticateuser, async (req, res) => {
  const { spaceId } = req.body;
  try {
    const space = await Space.findById(spaceId);
    if (req.user.userId != space.userId)
      return res.status(200).json({
        success: false,
        message: "property doesnot belongs to the user and cannot edit it",
      });
    if (space) {
      space.booked = false;
    }

    return res.status(200).json({
      success: true,
      space: { space },
      message: "the flat is unbooked change the colour",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while changing the staus",
      error: error.message,
    });
  }
});
router.get("/spaces/user/:userId", async (req, res) => {
  try {
    console.log(req.params.userId);
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    const user = await User.findById(req.params.userId).select("-password");
    const spaces = await Space.find({ userId: req.params.userId })
      .populate("userId", "name email") // Populate user details if needed
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!spaces) {
      return res.status(404).json({
        success: false,
        message: "No spaces found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      user: { user },
      count: spaces.length,
      data: spaces,
    });
  } catch (error) {
    console.error("Error in getting spaces by user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching spaces",
      error: error.message,
    });
  }
});
// router.get("/spaces/filter", authenticateUser, async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const {
//       limit = 10,
//       page = 1,
//       minRent = 0,
//       maxRent = Number.MAX_SAFE_INTEGER,
//       roomType,
//       cleanlinessLevel,
//       socializingLevel,
//       maxDistance,
//     } = req.query;

//     const skip = (page - 1) * limit;

//     // Validate user location
//     const user = await User.findById(userId).select("location.coordinates");
//     if (!user || !user.location || !Array.isArray(user.location.coordinates)) {
//       return res.status(400).json({
//         status: "error",
//         message: "User location or coordinates are missing",
//       });
//     }
//     const [longitude, latitude] = user.location.coordinates;

//     // Build query filters
//     const query = {
//       userId: { $ne: userId }, // Exclude user's own spaces
//       booked: false, // Only show unbooked spaces
//     };

//     // Add optional filters
//     if (minRent !== undefined && maxRent !== undefined) {
//       query.monthlyRent = {
//         $gte: Number(minRent),
//         $lte: Number(maxRent),
//       };
//     }

//     if (roomType) {
//       query.roomType = roomType;
//     }

//     if (cleanlinessLevel) {
//       query["flatmatePreferences.cleanlinessLevel"] = cleanlinessLevel;
//     }

//     if (socializingLevel) {
//       query["flatmatePreferences.socializingLevel"] = socializingLevel;
//     }

//     // Find spaces with optional geographic filtering
//     let spaces = await Space.find(query);

//     // Filter by distance if maxDistance is provided
//     let filteredMatches = spaces
//       .filter((match) => {
//         if (!match.location || !Array.isArray(match.location.coordinates)) {
//           return false;
//         }

//         if (maxDistance) {
//           const distance = calculateDistance(
//             latitude,
//             longitude,
//             match.location.coordinates[1],
//             match.location.coordinates[0]
//           );

//           if (distance > Number(maxDistance)) {
//             return false;
//           }
//         }

//         return true;
//       })
//       .map((match) => ({
//         _id: match._id,
//         userId: match.userId,
//         title: match.title,
//         location: match.location,
//         monthlyRent: match.monthlyRent,
//         roomType: match.roomType,
//         description: match.description,
//         images: match.images,
//         amenities: match.amenities,
//         flatmatePreferences: match.flatmatePreferences,
//         createdAt: match.createdAt,
//         updatedAt: match.updatedAt,
//         distance: calculateDistance(
//           latitude,
//           longitude,
//           match.location.coordinates[1],
//           match.location.coordinates[0]
//         ),
//       }));

//     // Sort matches by distance
//     filteredMatches.sort((a, b) => a.distance - b.distance);

//     // Paginate results
//     const paginatedMatches = filteredMatches.slice(skip, skip + Number(limit));

//     res.status(200).json({
//       status: "success",
//       data: {
//         matches: paginatedMatches,
//         total: filteredMatches.length,
//         page: Number(page),
//         totalPages: Math.ceil(filteredMatches.length / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Space filter error:", error);
//     res.status(400).json({
//       status: "error",
//       message: error.message,
//     });
//   }
// });
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
