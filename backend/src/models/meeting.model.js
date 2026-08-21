import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
  {
    // Existing field - preserved
    user_id: {
      type: String,
    },

    // Unique meeting code
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Meeting title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Host information
    hostName: {
      type: String,
      required: true,
      trim: true,
    },

    hostUserId: {
      type: String,
      default: null,
    },

    // Meeting status
    status: {
      type: String,
      enum: [
        "active",
        "ended",
      ],
      default: "active",
    },

    // Existing date field - preserved
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Participants waiting for host approval
    participants: [
      {
        userId: {
          type: String,
          default: null,
        },

        socketId: {
          type: String,
          default: null,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        status: {
          type: String,
          enum: [
            "pending",
            "approved",
            "rejected",
          ],
          default: "pending",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model(
  "Meeting",
  meetingSchema
);

export { Meeting };