import { Server } from "socket.io";

let rooms = {}; // { roomId: [socketIds] }

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // ✅ User joins a room
    socket.on("join-room", ({ roomId, userName }) => {
      console.log(`👤 ${userName} joined room ${roomId}`);

      socket.join(roomId); // ✅ Join room before broadcasting

      if (!rooms[roomId]) rooms[roomId] = [];
      rooms[roomId].push(socket.id);

      // Send list of all other users to this new user
      const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
      socket.emit("all-users", { users: otherUsers });

      // Notify other users that someone joined
      socket.to(roomId).emit("user-joined", { userId: socket.id, userName });
    });

    // ✅ WebRTC signaling
    socket.on("sending-signal", ({ to, signal }) => {
      io.to(to).emit("user-signal", { from: socket.id, signal });
    });

    socket.on("returning-signal", ({ to, signal }) => {
      io.to(to).emit("receiving-returned-signal", { from: socket.id, signal });
    });

    // ✅ Manual leave-room
    socket.on("leave-room", ({ roomId }) => {
      console.log(`🔴 User ${socket.id} left room ${roomId}`);
      socket.leave(roomId);

      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }

      socket.to(roomId).emit("user-left", socket.id);
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      for (const roomId in rooms) {
        const index = rooms[roomId].indexOf(socket.id);
        if (index !== -1) {
          rooms[roomId].splice(index, 1);
          socket.to(roomId).emit("user-left", socket.id);
          if (rooms[roomId].length === 0) delete rooms[roomId];
        }
      }
    });

    // ✅ CHAT FEATURE (Text Messages)
    socket.on("chat-message", ({ roomId, message, sender }) => {
      const payload = {
        sender,
        message,
        time: new Date().toISOString(),
        socketId: socket.id,
      };

      console.log(`💬 Message in Room ${roomId} from ${sender}: ${message}`);

      // Send message to everyone in the room (including sender)
      io.to(roomId).emit("chat-message", payload);
    });
  });

  return io;
};
