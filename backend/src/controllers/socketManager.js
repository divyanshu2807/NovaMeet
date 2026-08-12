import { Server } from "socket.io";

let rooms = {};

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

    let currentRoomId = null;

    // ==========================================
    // JOIN ROOM
    // ==========================================
    socket.on(
      "join-room",
      ({
        roomId,
        userName,
        audio = true,
        video = true,
      }) => {
        if (!roomId) return;

        const name = userName || "Guest";

        console.log(
          `👤 ${name} joined room ${roomId}`
        );

        // Prevent duplicate join
        if (
          currentRoomId === roomId &&
          rooms[roomId]?.some(
            (user) => user.socketId === socket.id
          )
        ) {
          console.log(
            `⚠️ ${socket.id} already in room ${roomId}`
          );
          return;
        }

        // Remove previous room
        if (
          currentRoomId &&
          currentRoomId !== roomId
        ) {
          removeUserFromRoom(currentRoomId);
        }

        currentRoomId = roomId;

        socket.join(roomId);

        if (!rooms[roomId]) {
          rooms[roomId] = [];
        }

        const existingUser = rooms[roomId].find(
          (user) => user.socketId === socket.id
        );

        if (!existingUser) {
          rooms[roomId].push({
            socketId: socket.id,
            userName: name,
            audio,
            video,
          });
        }

        // Existing users
        const otherUsers = rooms[roomId]
          .filter(
            (user) => user.socketId !== socket.id
          )
          .map((user) => ({
            userId: user.socketId,
            userName: user.userName,
            audio: user.audio,
            video: user.video,
          }));

        socket.emit("all-users", {
          users: otherUsers,
        });

        // Notify existing users
        socket.to(roomId).emit("user-joined", {
          userId: socket.id,
          userName: name,
          audio,
          video,
        });

        console.log(
          `👥 Room ${roomId} now has ${rooms[roomId].length} users`
        );
      }
    );

    // ==========================================
    // REAL-TIME MEDIA STATUS
    // ==========================================
    socket.on(
      "media-status",
      (
        {
          roomId,
          audio,
          video,
        },
        callback
      ) => {
        console.log(
          "📡 MEDIA STATUS EVENT RECEIVED:",
          {
            socketId: socket.id,
            roomId,
            audio,
            video,
          }
        );

        if (!roomId) {
          console.log(
            "❌ Media status rejected: no roomId"
          );

          if (typeof callback === "function") {
            callback({
              success: false,
              message: "Room ID missing",
            });
          }

          return;
        }

        const room = rooms[roomId];

        if (!room) {
          console.log(
            "❌ Media status rejected: room not found"
          );

          if (typeof callback === "function") {
            callback({
              success: false,
              message: "Room not found",
            });
          }

          return;
        }

        const user = room.find(
          (item) =>
            item.socketId === socket.id
        );

        if (!user) {
          console.log(
            "❌ Media status rejected: user not found"
          );

          if (typeof callback === "function") {
            callback({
              success: false,
              message: "User not found in room",
            });
          }

          return;
        }

        // Update audio
        if (typeof audio === "boolean") {
          user.audio = audio;
        }

        // Update video
        if (typeof video === "boolean") {
          user.video = video;
        }

        const status = {
          userId: socket.id,
          userName: user.userName,
          audio: user.audio,
          video: user.video,
        };

        console.log(
          `🎛️ ${user.userName} media status:`,
          {
            audio: user.audio,
            video: user.video,
          }
        );

        // Send to everyone ELSE in the room
        socket.to(roomId).emit(
          "media-status",
          status
        );

        console.log(
          `📤 Media status broadcasted to room ${roomId}`
        );

        // Send acknowledgement to sender
        if (typeof callback === "function") {
          callback({
            success: true,
            status,
          });
        }
      }
    );

    // ==========================================
    // WEBRTC SIGNALING
    // ==========================================
    socket.on(
      "sending-signal",
      ({ to, signal }) => {
        if (!to || !signal) return;

        io.to(to).emit("user-signal", {
          from: socket.id,
          signal,
        });
      }
    );

    socket.on(
      "returning-signal",
      ({ to, signal }) => {
        if (!to || !signal) return;

        io.to(to).emit(
          "receiving-returned-signal",
          {
            from: socket.id,
            signal,
          }
        );
      }
    );

    // ==========================================
    // LEAVE ROOM
    // ==========================================
    socket.on(
      "leave-room",
      ({ roomId }) => {
        const targetRoom =
          roomId || currentRoomId;

        if (!targetRoom) return;

        console.log(
          `🔴 User ${socket.id} left room ${targetRoom}`
        );

        removeUserFromRoom(targetRoom);

        socket.leave(targetRoom);

        if (currentRoomId === targetRoom) {
          currentRoomId = null;
        }
      }
    );

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on("disconnect", () => {
      console.log(
        "❌ User disconnected:",
        socket.id
      );

      if (currentRoomId) {
        removeUserFromRoom(
          currentRoomId
        );

        currentRoomId = null;
      } else {
        for (const roomId in rooms) {
          if (
            rooms[roomId]?.some(
              (user) =>
                user.socketId ===
                socket.id
            )
          ) {
            removeUserFromRoom(roomId);
          }
        }
      }
    });

    // ==========================================
    // CHAT
    // ==========================================
    socket.on(
      "chat-message",
      ({
        roomId,
        message,
        sender,
      }) => {
        if (
          !roomId ||
          !message?.trim()
        ) {
          return;
        }

        const payload = {
          sender:
            sender || "Guest",
          message: message.trim(),
          time:
            new Date().toISOString(),
          socketId: socket.id,
        };

        console.log(
          `💬 Message in Room ${roomId} from ${payload.sender}: ${payload.message}`
        );

        io.to(roomId).emit(
          "chat-message",
          payload
        );
      }
    );

    // ==========================================
    // ROOM CLEANUP
    // ==========================================
    function removeUserFromRoom(
      roomId
    ) {
      if (!rooms[roomId]) return;

      const user =
        rooms[roomId].find(
          (item) =>
            item.socketId ===
            socket.id
        );

      if (!user) return;

      rooms[roomId] =
        rooms[roomId].filter(
          (item) =>
            item.socketId !==
            socket.id
        );

      socket.to(roomId).emit(
        "user-left",
        socket.id
      );

      console.log(
        `👥 Room ${roomId} now has ${rooms[roomId].length} users`
      );

      if (
        rooms[roomId].length === 0
      ) {
        delete rooms[roomId];

        console.log(
          `🗑️ Room ${roomId} deleted`
        );
      }
    }
  });

  return io;
};