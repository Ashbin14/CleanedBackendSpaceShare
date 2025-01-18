import User from "../models/user.js"; // Import user model
import jwt from "jsonwebtoken"; // Import jwt only once
import dotenv from "dotenv"; // Import dotenv for environment variables
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing
import crypto from "crypto"; // Import crypto for generating random tokens
import Token from "../models/token.js";
import auth from "../middleware/auth.js";
import path from "path";

dotenv.config();
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName,age,gender,phoneNumber, email, password,location} = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }
    const imageFiles = req.files.map(file => file.filename);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }
    const geoLocation = location ? {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]  // [longitude, latitude]
    } : undefined;
    const user = new User({
      firstName,
      lastName,
      age,
      gender,
      phoneNumber,
      email,
      location: geoLocation,
      password,
      imageFiles
    });

    const result = await user.save();
    result.password = undefined;
 
    res.status(201).json({
      status: "success",
      message: "Registration successful",
      result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
const logout = async (req, res) => {
  try {
    const token = req.token;
    await Token.findOneAndDelete({ token });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default { login, register, logout };
