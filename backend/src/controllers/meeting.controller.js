import { Meeting } from "../models/meeting.model.js";

// ==========================================
// CREATE MEETING
// ==========================================
export const createMeeting = async (req, res) => {
  try {
    const {
      meetingCode,
      title,
      hostName,
      hostUserId,
    } = req.body;

    if (!meetingCode || !title || !hostName) {
      return res.status(400).json({
        message:
          "Meeting code, title and host name are required",
      });
    }

    // Check if meeting code already exists
    const existingMeeting = await Meeting.findOne({
      meetingCode: meetingCode.trim(),
    });

    if (existingMeeting) {
      return res.status(409).json({
        message: "Meeting code already exists",
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      meetingCode: meetingCode.trim(),
      title: title.trim(),
      hostName: hostName.trim(),
      hostUserId: hostUserId || null,
      status: "active",
      date: new Date(),
    });

    console.log(
      "🟢 MEETING CREATED:",
      meeting.meetingCode
    );

    return res.status(201).json({
      message: "Meeting created successfully",
      meeting: {
        id: meeting._id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        hostName: meeting.hostName,
        hostUserId: meeting.hostUserId,
        status: meeting.status,
        date: meeting.date,
      },
    });
  } catch (error) {
    console.error(
      "❌ Create Meeting Error:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Something went wrong while creating the meeting",
    });
  }
};

// ==========================================
// GET / VALIDATE MEETING
// ==========================================
export const getMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.params;

    if (!meetingCode) {
      return res.status(400).json({
        message: "Meeting code is required",
      });
    }

    const meeting = await Meeting.findOne({
      meetingCode: meetingCode.trim(),
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (meeting.status === "ended") {
      return res.status(410).json({
        message: "This meeting has ended",
      });
    }

    return res.status(200).json({
      message: "Meeting found",
      meeting: {
        id: meeting._id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        hostName: meeting.hostName,
        hostUserId: meeting.hostUserId,
        status: meeting.status,
        date: meeting.date,
      },
    });
  } catch (error) {
    console.error(
      "❌ Get Meeting Error:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Something went wrong while finding the meeting",
    });
  }
};