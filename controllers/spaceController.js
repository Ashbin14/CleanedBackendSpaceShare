import { Space } from "../models/space.js";
import { getFileUrl } from "../config/multerconfig.js";
import path from "path";
import User from "../models/user.js";


const createSpace = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }
    console.log(req.user);
    const {
      title,
      location,
      monthlyRent,
      roomType,
      description,
      amenities,
      flatmatePreferences,
      booked
    } = req.body;
    const userId = req.user.userId;
    if (!location || !location.latitude || !location.longitude) {
      return res
        .status(400)
        .json({ error: "Location with latitude and longitude is required." });
    }
    const images = req.files.map((file) => getFileUrl(file.filename));
    const geoLocation = {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    };

    const space = new Space({
      userId,
      title,
      location: geoLocation,
      monthlyRent,
      roomType,
      description,
      images,
      amenities,
      flatmatePreferences,
      booked,
    });

    await space.save();
    res.status(201).json({ status: "success", data: space });
  } catch (error) {
    console.error("Create space error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

const getSpaces = async (req, res) => {
  try {
    const { maxDistance } = req.query;

    // Fetch user and validate location data
    const user = await User.findById(req.user.userId);
    console.log("user", user);

    // if (user && user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
    //   const spaces = await Space.find({
    //     location: {
    //       $near: {
    //         $geometry: {
    //           type: "Point",
    //           coordinates: [user.location.coordinates[0], user.location.coordinates[1]], // [longitude, latitude]
    //         },
    //         $maxDistance: maxDistance || 10000, // Default to 10 km
    //       },
    //     },
    //   });
    //   console.log("here 2");

    //   return res.status(200).json({ status: "success", data: spaces });
    // } else {
    //   console.warn("User location data is missing or invalid.");
    // }

    // If no geospatial query is needed, return all spaces
    const spaces = await Space.find();
    res.status(200).json({ status: "success", data: spaces });
  } catch (error) {
    console.error("Get spaces error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};


const getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res
        .status(404)
        .json({ status: "error", message: "Space not found" });
    }
    const user = await User.findById(space.userId);
    if(!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    res.status(200).json({ status: "success", user: user, data: space });
  } catch (error) {
    console.error("Get space by ID error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

const updateSpace = async (req, res) => {
  try {
    const {
      title,
      location,
      monthlyRent,
      roomType,
      description,
      amenities,
      flatmatePreferences,
    } = req.body;
    const images = req.files ? req.files.map((file) => file.path) : [];

    // Assuming location is being passed as { latitude, longitude }
    const geoLocation = location
      ? {
          type: "Point",
          coordinates: [location.longitude, location.latitude], // [longitude, latitude]
        }
      : undefined;

    const updatedSpace = await Space.findByIdAndUpdate(
      req.params.id,
      {
        title,
        location: geoLocation,
        monthlyRent,
        roomType,
        description,
        images,
        amenities,
        flatmatePreferences,
      },
      { new: true }
    );

    if (!updatedSpace) {
      return res
        .status(404)
        .json({ status: "error", message: "Space not found" });
    }
    res.status(200).json({ status: "success", data: updatedSpace });
  } catch (error) {
    console.error("Update space error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

const deleteSpace = async (req, res) => {
  try {
    const space = await Space.findByIdAndDelete(req.params.id);
    if (!space) {
      return res
        .status(404)
        .json({ status: "error", message: "Space not found" });
    }
    res
      .status(200)
      .json({ status: "success", message: "Space deleted successfully" });
  } catch (error) {
    console.error("Delete space error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

export const spaceController = {
  createSpace,
  getSpaces,
  getSpaceById,
  updateSpace,
  deleteSpace,
};
