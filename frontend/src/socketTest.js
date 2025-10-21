import { io } from "socket.io-client";

// backend ka URL daal (tera backend port 8000 pe chal raha hai)
const socket = io("http://localhost:8000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("🟢 Connected to NovaMeet Socket Server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from NovaMeet server");
});

export default socket;
