import { Router } from "express";
import {
  login,
  register,
  verifyEmail,
} from "../controllers/user.controller.js";

const router = Router();

// 🔐 Authentication routes
router.post("/login", login);
router.post("/register", register);

// 📧 Email verification route
router.get("/verify-email", verifyEmail);

// ❌ These are not needed yet
// router.post("/add_to_activity", addToHistory);
// router.get("/get_all_activity", getUserHistory);

export default router;