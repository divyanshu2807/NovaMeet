import { Router } from "express";

import {
  createMeeting,
  getMeeting,
} from "../controllers/meeting.controller.js";

const router = Router();

// ==========================================
// CREATE MEETING
// ==========================================
router.post("/", createMeeting);

// ==========================================
// GET / VALIDATE MEETING
// ==========================================
router.get("/:meetingCode", getMeeting);

export default router;