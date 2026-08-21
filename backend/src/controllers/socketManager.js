import { Server } from "socket.io";

let rooms = {};
let pendingRequests = {};

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
    // JOIN ROOM / JOIN REQUEST
    // ==========================================
    socket.on(
      "join-room",
      ({
        roomId,
        userName,
        audio = true,
        video = true,
        isHost = false,
      }) => {
        if (!roomId) return;

        const name = userName || "Guest";

        console.log(
          `👤 ${name} wants to join room ${roomId}`
        );

        // ==========================================
        // CREATE ROOM IF IT DOES NOT EXIST
        // ==========================================
        if (!rooms[roomId]) {
          rooms[roomId] = [];
        }

        // ==========================================
        // PREVENT DUPLICATE JOIN
        // ==========================================
        if (
          rooms[roomId].some(
            (user) => user.socketId === socket.id
          )
        ) {
          console.log(
            `⚠️ ${socket.id} already in room ${roomId}`
          );
          return;
        }

        // ==========================================
        // HOST JOIN
        // ==========================================
        // First person / explicit host becomes host.
        const hostAlreadyExists = rooms[roomId].some(
          (user) => user.isHost === true
        );

        const shouldBeHost =
          isHost || !hostAlreadyExists;

        if (shouldBeHost) {
          // Remove previous room if needed
          if (
            currentRoomId &&
            currentRoomId !== roomId
          ) {
            removeUserFromRoom(currentRoomId);
          }

          currentRoomId = roomId;

          socket.join(roomId);

          rooms[roomId].push({
            socketId: socket.id,
            userName: name,
            audio,
            video,
            isHost: true,
          });

          console.log(
            `👑 ${name} is HOST of room ${roomId}`
          );

          // Existing users
          const otherUsers = rooms[roomId]
            .filter(
              (user) =>
                user.socketId !== socket.id
            )
            .map((user) => ({
              userId: user.socketId,
              userName: user.userName,
              audio: user.audio,
              video: user.video,
              isHost: user.isHost,
            }));

          socket.emit("all-users", {
            users: otherUsers,
          });

          // Notify existing users
          socket.to(roomId).emit(
            "user-joined",
            {
              userId: socket.id,
              userName: name,
              audio,
              video,
              isHost: true,
            }
          );

          console.log(
            `👥 Room ${roomId} now has ${rooms[roomId].length} users`
          );

          return;
        }

        // ==========================================
        // GUEST JOIN REQUEST
        // ==========================================

        if (!pendingRequests[roomId]) {
          pendingRequests[roomId] = [];
        }

        // Prevent duplicate pending request
        const alreadyPending =
          pendingRequests[roomId].some(
            (request) =>
              request.socketId === socket.id
          );

        if (alreadyPending) {
          console.log(
            `⚠️ ${name} already has a pending request`
          );

          socket.emit("join-request-pending", {
            roomId,
            message:
              "Your request is already waiting for host approval.",
          });

          return;
        }

        const host = rooms[roomId].find(
          (user) => user.isHost === true
        );

        if (!host) {
          socket.emit("join-rejected", {
            roomId,
            message:
              "Host is not available.",
          });

          return;
        }

        const request = {
          socketId: socket.id,
          userName: name,
          roomId,
          audio,
          video,
          requestedAt:
            new Date().toISOString(),
        };

        pendingRequests[roomId].push(request);

        console.log(
          `🔔 JOIN REQUEST: ${name} → ${roomId}`
        );

        // Tell guest to wait
        socket.emit(
          "join-request-pending",
          {
            roomId,
            message:
              "Waiting for host approval...",
          }
        );

        // Send request to host only
        io.to(host.socketId).emit(
          "join-request",
          {
            roomId,
            userId: socket.id,
            userName: name,
            audio,
            video,
            requestedAt:
              request.requestedAt,
          }
        );
      }
    );

    // ==========================================
    // HOST APPROVES JOIN REQUEST
    // ==========================================
    socket.on(
      "approve-join-request",
      ({
        roomId,
        userId,
      }) => {
        if (!roomId || !userId) return;

        const room = rooms[roomId];

        if (!room) {
          socket.emit(
            "approval-error",
            {
              message: "Room not found.",
            }
          );

          return;
        }

        // Only host can approve
        const host = room.find(
          (user) =>
            user.socketId === socket.id &&
            user.isHost === true
        );

        if (!host) {
          socket.emit(
            "approval-error",
            {
              message:
                "Only the host can approve participants.",
            }
          );

          return;
        }

        const requestIndex =
          pendingRequests[roomId]?.findIndex(
            (request) =>
              request.socketId === userId
          );

        if (
          requestIndex === undefined ||
          requestIndex === -1
        ) {
          socket.emit(
            "approval-error",
            {
              message:
                "Join request no longer exists.",
            }
          );

          return;
        }

        const request =
          pendingRequests[roomId][
            requestIndex
          ];

        // Remove pending request
        pendingRequests[roomId].splice(
          requestIndex,
          1
        );

        // Add guest to Socket.IO room
        io.sockets.sockets
          .get(userId)
          ?.join(roomId);

        // Add guest to our room state
        room.push({
          socketId: userId,
          userName: request.userName,
          audio: request.audio,
          video: request.video,
          isHost: false,
        });

        console.log(
          `✅ HOST APPROVED: ${request.userName} → ${roomId}`
        );

        // Tell guest approval succeeded
        io.to(userId).emit(
          "join-approved",
          {
            roomId,
            userId,
            userName:
              request.userName,
            message:
              "Host approved your request.",
          }
        );

        // Get all existing users except approved user
        const otherUsers = room
          .filter(
            (user) =>
              user.socketId !== userId
          )
          .map((user) => ({
            userId: user.socketId,
            userName: user.userName,
            audio: user.audio,
            video: user.video,
            isHost: user.isHost,
          }));

        // Send existing users to approved guest
        io.to(userId).emit(
          "all-users",
          {
            users: otherUsers,
          }
        );

        // ==========================================
        // IMPORTANT:
        // Notify everyone else EXCEPT the newly
        // approved guest.
        // ==========================================
        io.to(roomId)
          .except(userId)
          .emit(
            "user-joined",
            {
              userId,
              userName:
                request.userName,
              audio: request.audio,
              video: request.video,
              isHost: false,
            }
          );

        // Tell host that request was handled
        socket.emit(
          "join-request-approved",
          {
            userId,
            userName:
              request.userName,
          }
        );

        console.log(
          `👥 Room ${roomId} now has ${room.length} users`
        );
      }
    );

    // ==========================================
    // HOST REJECTS JOIN REQUEST
    // ==========================================
    socket.on(
      "reject-join-request",
      ({
        roomId,
        userId,
      }) => {
        if (!roomId || !userId) return;

        const room = rooms[roomId];

        if (!room) return;

        // Only host can reject
        const host = room.find(
          (user) =>
            user.socketId === socket.id &&
            user.isHost === true
        );

        if (!host) {
          socket.emit(
            "approval-error",
            {
              message:
                "Only the host can reject participants.",
            }
          );

          return;
        }

        const requestIndex =
          pendingRequests[roomId]?.findIndex(
            (request) =>
              request.socketId === userId
          );

        if (
          requestIndex === undefined ||
          requestIndex === -1
        ) {
          return;
        }

        const request =
          pendingRequests[roomId][
            requestIndex
          ];

        // Remove request
        pendingRequests[roomId].splice(
          requestIndex,
          1
        );

        console.log(
          `❌ HOST REJECTED: ${request.userName} → ${roomId}`
        );

        // Tell guest
        io.to(userId).emit(
          "join-rejected",
          {
            roomId,
            message:
              "The host rejected your request to join.",
          }
        );

        // Tell host
        socket.emit(
          "join-request-rejected",
          {
            userId,
            userName:
              request.userName,
          }
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
          if (typeof callback === "function") {
            callback({
              success: false,
              message:
                "User not found in room",
            });
          }

          return;
        }

        if (typeof audio === "boolean") {
          user.audio = audio;
        }

        if (typeof video === "boolean") {
          user.video = video;
        }

        const status = {
          userId: socket.id,
          userName: user.userName,
          audio: user.audio,
          video: user.video,
        };

        socket.to(roomId).emit(
          "media-status",
          status
        );

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

        if (
          currentRoomId === targetRoom
        ) {
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

      // Remove pending requests
      for (const roomId in pendingRequests) {
        pendingRequests[roomId] =
          pendingRequests[roomId].filter(
            (request) =>
              request.socketId !== socket.id
          );

        if (
          pendingRequests[roomId].length === 0
        ) {
          delete pendingRequests[roomId];
        }
      }

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

      // Remove pending requests for this socket
      if (pendingRequests[roomId]) {
        pendingRequests[roomId] =
          pendingRequests[roomId].filter(
            (request) =>
              request.socketId !==
              socket.id
          );

        if (
          pendingRequests[roomId].length === 0
        ) {
          delete pendingRequests[roomId];
        }
      }

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

        if (pendingRequests[roomId]) {
          delete pendingRequests[roomId];
        }

        console.log(
          `🗑️ Room ${roomId} deleted`
        );
      }
    }
  });

  return io;
};