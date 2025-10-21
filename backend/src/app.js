import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// 🟢 Middleware setup
app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// 🧩 Routes
app.use("/api/v1/users", userRoutes);

// 🧠 Database Connection
const startServer = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MONGO Connected to: ${connectionDb.connection.host}`);

    // Start Server after DB Connection
    server.listen(app.get("port"), () => {
      console.log(`🚀 Server running on PORT ${app.get("port")}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Stop process if DB fails
  }
};

startServer();
