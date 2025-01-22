import express from "express";
import authController from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import { upload } from "../config/multerUser.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", upload.array("images", 5), authController.register);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/verify-email/:token", authController.verifyEmail);
router.get("/reset-password/:token", authController.validateResetToken);

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

export default router;
