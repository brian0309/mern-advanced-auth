import express, { Router } from "express";
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

const router: Router = express.Router();

// Google OAuth routes
router.get("/auth/google/url", getGoogleAuthUrl);
router.get("/auth/google/callback", googleAuthCallback);

// Regular auth routes
router.get("/auth/check-auth", verifyToken, checkAuth);
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password/:token", resetPassword);
router.post("/auth/change-password", verifyToken, changePassword);

export default router;
