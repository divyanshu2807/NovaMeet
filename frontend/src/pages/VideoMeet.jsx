import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Peer from "simple-peer";
import { MessageCircle, X } from "lucide-react";
import socket from "../socketTest";

export default function VideoMeet() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const userVideo = useRef(null);
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);
  const localStreamRef = useRef(null);
  const userName = state?.userName || "Guest";

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // 🧩 Chat states
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const addPeerRef = (peerID, peer) => {
      peersRef.current.push({ peerID, peer });
      setPeers((prev) => [...prev, { id: peerID, peer }]);
    };

    const removePeerRef = (peerID) => {
      peersRef.current = peersRef.current.filter((p) => p.peerID !== peerID);
      setPeers(peersRef.current.map((p) => ({ id: p.peerID, peer: p.peer })));
    };

    socket.off("all-users");
    socket.off("user-joined");
    socket.off("user-signal");
    socket.off("receiving-returned-signal");
    socket.off("user-left");
    socket.off("chat-message");

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const videoTrack = stream.getVideoTracks()[0];
        await new Promise((resolve) => {
          if (videoTrack && videoTrack.readyState === "live") return resolve();
          const check = setInterval(() => {
            if (videoTrack.readyState === "live") {
              clearInterval(check);
              resolve();
            }
          }, 100);
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (userVideo.current) userVideo.current.srcObject = stream;

        await new Promise((r) => setTimeout(r, 600));
        socket.emit("join-room", { roomId, userName });

        socket.on("all-users", ({ users }) => {
          users.forEach((userId) => {
            const exists = peersRef.current.find((p) => p.peerID === userId);
            if (exists) return;
            const peer = createInitiatorPeer(userId, socket.id, stream);
            addPeerRef(userId, peer);
          });
        });

        socket.on("user-joined", ({ userId }) => {
          const exists = peersRef.current.find((p) => p.peerID === userId);
          if (exists) return;
          const peer = createReceiverPeer(userId, stream);
          addPeerRef(userId, peer);
        });

        socket.on("user-signal", ({ from, signal }) => {
          let item = peersRef.current.find((p) => p.peerID === from);
          if (!item) {
            const peer = createReceiverPeer(from, stream);
            addPeerRef(from, peer);
            item = peersRef.current.find((p) => p.peerID === from);
          }
          if (item && item.peer && !item.peer.destroyed) {
            try {
              item.peer.signal(signal);
            } catch (err) {
              console.warn("Signal error:", err.message);
            }
          }
        });

        socket.on("receiving-returned-signal", ({ from, signal }) => {
          const item = peersRef.current.find((p) => p.peerID === from);
          if (item && item.peer && !item.peer.destroyed) {
            try {
              item.peer.signal(signal);
            } catch (err) {
              console.warn("Return signal error:", err.message);
            }
          }
        });

        socket.on("user-left", (id) => removePeerRef(id));

        // 🧠 Chat listener
        socket.on("chat-message", (data) => {
          setMessages((prev) => [...prev, data]);
        });
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Please allow camera and microphone permissions.");
      }
    })();

    return () => {
      mounted = false;
      socket.emit("leave-room", { roomId });
      peersRef.current.forEach((p) => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId, userName]);

  const createInitiatorPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("sending-signal", { to: userToSignal, signal }));
    return peer;
  };

  const createReceiverPeer = (userId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("returning-signal", { to: userId, signal }));
    return peer;
  };

  // 🧩 Chat send
  const sendMessage = () => {
    if (!message.trim()) return;
    const payload = { roomId, message, sender: userName };
    socket.emit("chat-message", payload);
    setMessage("");
  };

  // ✅ --- UI Part ---
  return (
    <div
      style={{
        background: "radial-gradient(circle at center, #081229, #0B0F1A)",
        minHeight: "100vh",
        padding: "40px 20px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "2rem",
          color: "#00BFFF",
          marginBottom: "25px",
        }}
      >
        Room: {roomId}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          justifyItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "2px solid #00BFFF",
              boxShadow: "0 0 20px rgba(0,191,255,0.5)",
            }}
          />
        </div>
        {peers.map((p) => (
          <Video key={p.id} peer={p.peer} />
        ))}
      </div>

      {/* 🎛 Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "30px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            if (!localStreamRef.current) return;
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = !audioTrack.enabled;
              setIsMuted(!audioTrack.enabled);
            }
          }}
          style={btnStyle(isMuted ? "#555" : "#00BFFF")}
        >
          {isMuted ? "🔇 Unmute" : "🎙 Mute"}
        </button>

        <button
          onClick={() => {
            if (!localStreamRef.current) return;
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = !videoTrack.enabled;
              setIsCameraOff(!videoTrack.enabled);
            }
          }}
          style={btnStyle(isCameraOff ? "#555" : "#00BFFF")}
        >
          {isCameraOff ? "📷 Camera On" : "🎥 Camera Off"}
        </button>

        <button
          onClick={() => {
            try {
              socket.emit("leave-room", { roomId });
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
              }
              window.location.href = "/home";
            } catch (e) {
              console.error("Leave meeting error:", e);
            }
          }}
          style={btnStyle("#FF4B4B")}
        >
          🚪 Leave Meeting
        </button>
      </div>

      {/* 💬 Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#00BFFF",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            padding: "12px",
            boxShadow: "0 0 15px rgba(0,191,255,0.5)",
            cursor: "pointer",
          }}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* 💬 Sliding Chat Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: chatOpen ? "0" : "-340px",
          width: "320px",
          height: "100%",
          background: "#111827",
          borderLeft: "2px solid #00BFFF",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          transition: "right 0.4s ease-in-out",
        }}
      >
        <div
          style={{
            background: "#00BFFF",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            fontWeight: "bold",
          }}
        >
          <span>💬 Chat Room</span>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px",
            fontSize: "0.9rem",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "8px",
                textAlign: msg.sender === userName ? "right" : "left",
              }}
            >
              <b style={{ color: "#00BFFF" }}>{msg.sender}:</b> {msg.message}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderTop: "1px solid #00BFFF" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              background: "#0B1120",
              border: "none",
              padding: "10px",
              color: "#fff",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            style={{
              background: "#00BFFF",
              color: "#fff",
              border: "none",
              padding: "10px 15px",
              cursor: "pointer",
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#aaa",
          marginTop: "25px",
          fontSize: "0.9rem",
        }}
      >
         NovaMeet Project 🚀
      </p>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: color,
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    boxShadow: "0 0 10px rgba(0,191,255,0.4)",
  };
}

function Video({ peer }) {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div style={{ width: "100%", maxWidth: 600 }}>
      <video
        playsInline
        autoPlay
        ref={ref}
        style={{
          width: "100%",
          borderRadius: "10px",
          border: "2px solid #00BFFF",
          boxShadow: "0 0 20px rgba(0,191,255,0.5)",
        }}
      />
    </div>
  );
}
