import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";

import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";

const app = express();
const server = createServer(app);

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://nova-meet-six.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an origin
    // Postman, curl, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: "40kb" }));

app.use(
  express.urlencoded({
    limit: "40kb",
    extended: true,
  })
);

// =====================================================
// SOCKET.IO
// =====================================================

const io = connectToSocket(server);

// =====================================================
// PORT
// =====================================================

app.set("port", process.env.PORT || 8000);

// =====================================================
// ROUTES
// =====================================================

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/meetings", meetingRoutes);

// =====================================================
// DATABASE CONNECTION
// =====================================================

const startServer = async () => {
  try {
    const connectionDb = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      `✅ MONGO Connected to: ${connectionDb.connection.host}`
    );

    server.listen(app.get("port"), "0.0.0.0", () => {
      console.log(
        `🚀 Server running on PORT ${app.get("port")}`
      );
    });
  } catch (error) {
    console.error(
      "❌ MongoDB Connection Failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();