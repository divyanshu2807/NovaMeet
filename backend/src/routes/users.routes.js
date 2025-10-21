import { Router } from "express";
import { login, register } from "../controllers/user.controller.js";

const router = Router();

// ✅ Only working routes for now
router.post("/login", login);
router.post("/register", register);

// ❌ These are not needed yet, so comment them out
// router.post("/add_to_activity", addToHistory);
// router.get("/get_all_activity", getUserHistory);

export default router;
