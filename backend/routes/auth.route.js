import express from "express";
import {
	login,
	logout,
	signup,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
	changePassword
} from "../controllers/auth.controller.js";
import { getGoogleAuthUrl, googleAuthCallback } from "../controllers/googleAuth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Google OAuth routes
router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleAuthCallback);

// Regular auth routes
router.get("/check-auth", verifyToken, checkAuth);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", verifyToken, changePassword);

export default router;
