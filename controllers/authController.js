import User from "../models/user.js"; // Import user model
import jwt from "jsonwebtoken"; // Import jwt only once
import dotenv from "dotenv"; // Import dotenv for environment variables
import bcrypt from "bcryptjs"; // Import bcrypt for password hashing
import crypto from "crypto"; // Import crypto for generating random tokens
import Token from "../models/token.js";
import auth from "../middleware/auth.js";
import path from "path";
import nodemailer from "nodemailer";

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

    if (!user.isEmailVerified) {
      return res.status(401).json({
        status: "error",
        message: "Please verify your email first",
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
    const {
      firstName,
      lastName,
      age,
      gender,
      phoneNumber,
      email,
      password,
      location,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const images = req.files ? req.files.map((file) => file.filename) : [];

    const geoLocation = location
      ? {
          type: "Point",
          coordinates: [
            parseFloat(location.longitude),
            parseFloat(location.latitude),
          ],
        }
      : undefined;

    const user = new User({
      firstName,
      lastName,
      age,
      gender,
      phoneNumber,
      email,
      location: geoLocation,
      password,
      images,
    });

    await sendVerificationEmail(user);
    const result = await user.save();
    result.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Registration successful. Please verify your email",
      result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Server error",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
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

// nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:5174/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ status: "success", message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

const sendVerificationEmail = async (user) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 3600000; // 24 hours
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Password reset token is invalid or has expired",
      });
    }

    // Hash the new password (assuming you have a pre-save middleware for this)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Password reset token is invalid or has expired",
      });
    }

    res.json({
      status: "success",
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

export default {
  login,
  register,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  validateResetToken,
};
