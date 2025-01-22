import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userProfie from "./routes/userRoute.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import multer from "multer";
import mbtiRoutes from "./routes/mibtRoute.js";
import http from "http";
import messageRoutes from "./routes/messageRoutes.js";
import { app, io, server } from "./socket/socketHandler.js";
import matchRoutes from "./routes/similarityRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import { seedDatabase } from "./routes/seed.js";

dotenv.config();

// Middleware setup
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add these headers as well
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error(
    "MongoDB URI not defined. Make sure to add it to your .env file."
  );
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/uploads/", express.static("uploads"));
app.use("/mibt", mbtiRoutes);
app.use("/api/space", spaceRoutes);
app.use("/api/matches", matchRoutes);
app.post("/api/seed", seedDatabase);
app.use("/profile", userProfie);
app.use("/api/messages", messageRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File size is too large. Maximum size is 5MB",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "File limit exceeded. Maximum 5 images allowed",
      });
    }
  }
  res.status(500).json({ error: error.message });
});

// File serving routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/spaces/:filename", (req, res) => {
  const filePath = path.join(__dirname, "spaces", req.params.filename);
  console.log(filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
});

app.get("/profile/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  console.log(filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
