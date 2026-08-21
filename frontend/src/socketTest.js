import { io } from "socket.io-client";
import server from "./environment";

const socket = io(server, {
  transports: ["websocket"],
  autoConnect: true,
});

socket.on("connect", () => {
  console.log(
    "🟢 Connected to NovaMeet Socket Server:",
    socket.id
  );
});

socket.on("disconnect", (reason) => {
  console.log(
    "🔴 Disconnected from NovaMeet server:",
    reason
  );
});

socket.on("connect_error", (error) => {
  console.error(
    "❌ Socket connection error:",
    error.message
  );
});

export default socket;