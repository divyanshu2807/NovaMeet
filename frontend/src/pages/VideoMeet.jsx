import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Peer from "simple-peer";
import { MessageCircle, X } from "lucide-react";
import ShareMeeting from "../components/ShareMeeting";
import socket from "../socketTest";

export default function VideoMeet() {
  const { roomId } = useParams();
  const { state } = useLocation();

  // ==========================================
  // HOST / GUEST
  // ==========================================
  const isHost = state?.isHost === true;

  const [joinStatus, setJoinStatus] = useState(isHost ? "approved" : "waiting");

  const [joinMessage, setJoinMessage] = useState(
    isHost ? "You are the host." : "Waiting for host approval...",
  );

  const [joinRequests, setJoinRequests] = useState([]);
  useEffect(() => {
    console.log("📋 Current Join Requests:", joinRequests);
  }, [joinRequests]);

  const userVideo = useRef(null);
  const peersRef = useRef([]);
  const localStreamRef = useRef(null);

  const cameraTrackRef = useRef(null);

  const screenStreamRef = useRef(null);
  const screenTrackRef = useRef(null);

  const [peers, setPeers] = useState([]);

  const userName = state?.userName || "Guest";

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);

  // ==========================================
  // MEETING TIMER
  // ==========================================
  const [meetingSeconds, setMeetingSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ==========================================
  // FORMAT MEETING TIME
  // ==========================================
  const formatMeetingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor((seconds % 3600) / 60);

    const secs = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  // ==========================================
  // MEETING SETUP
  // ==========================================
  useEffect(() => {
    let mounted = true;

    // ==========================================
    // ADD PEER
    // ==========================================
    const addPeer = (
      peerID,
      peer,
      participantName,
      audio = true,
      video = true,
    ) => {
      const peerData = {
        peerID,
        peer,
        userName: participantName || "Guest",
        audio,
        video,
      };

      const alreadyExists = peersRef.current.some(
        (item) => item.peerID === peerID,
      );

      if (alreadyExists) {
        return;
      }

      peersRef.current.push(peerData);

      setPeers((prev) => {
        const exists = prev.some((item) => item.id === peerID);

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          {
            id: peerID,
            peer,
            userName: participantName || "Guest",
            audio,
            video,
          },
        ];
      });
    };

    // ==========================================
    // REMOVE PEER
    // ==========================================
    const removePeer = (peerID) => {
      const item = peersRef.current.find((peer) => peer.peerID === peerID);

      if (item?.peer && !item.peer.destroyed) {
        item.peer.destroy();
      }

      peersRef.current = peersRef.current.filter(
        (item) => item.peerID !== peerID,
      );

      setPeers((prev) => prev.filter((item) => item.id !== peerID));
    };

    // ==========================================
    // REMOVE OLD SOCKET LISTENERS
    // ==========================================
    socket.off("all-users");
    socket.off("user-joined");
    socket.off("user-signal");
    socket.off("receiving-returned-signal");
    socket.off("user-left");
    socket.off("chat-message");
    socket.off("media-status");

    socket.off("join-request");
    socket.off("join-request-approved");
    socket.off("join-request-rejected");
    socket.off("join-approved");
    socket.off("join-rejected");
    socket.off("join-request-pending");
    socket.off("approval-error");

    // ==========================================
    // START MEETING
    // ==========================================
    const startMeeting = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());

          return;
        }

        localStreamRef.current = stream;

        cameraTrackRef.current = stream.getVideoTracks()[0] || null;

        // ==========================================
        // LOCAL VIDEO
        // ==========================================
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        // ==========================================
        // JOIN ROOM
        // ==========================================
        socket.emit("join-room", {
          roomId,
          userName,
          audio: true,
          video: true,
          isHost,
        });

        console.log("🚪 Join request sent:", {
          roomId,
          userName,
          isHost,
        });

        // ==========================================
        // JOIN REQUEST PENDING
        // ==========================================
        socket.on("join-request-pending", ({ message }) => {
          console.log("⏳ Waiting for host:", message);

          setJoinStatus("waiting");

          setJoinMessage(message || "Waiting for host approval...");
        });

        // ==========================================
        // GUEST APPROVED
        // ==========================================
        socket.on("join-approved", ({ message }) => {
          console.log("✅ Host approved:", message);

          setJoinStatus("approved");

          setJoinMessage("Host approved your request.");
        });

        // ==========================================
        // GUEST REJECTED
        // ==========================================
        socket.on("join-rejected", ({ message }) => {
          console.log("❌ Host rejected:", message);

          setJoinStatus("rejected");

          setJoinMessage(message || "The host rejected your request.");

          // Stop local media
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());

            localStreamRef.current = null;
          }
        });

        // ==========================================
        // HOST RECEIVES JOIN REQUEST
        // ==========================================
        socket.on("join-request", (request) => {
          if (!isHost) {
            return;
          }

          console.log("🔔 New join request:", request);

          setJoinRequests((prev) => {
            const exists = prev.some((item) => item.userId === request.userId);

            if (exists) {
              return prev;
            }

            return [...prev, request];
          });
        });

        // ==========================================
        // HOST APPROVED REQUEST
        // ==========================================
        socket.on(
          "join-request-approved",
          ({ userId, userName: approvedUserName }) => {
            if (!isHost) {
              return;
            }

            console.log(`✅ Approved ${approvedUserName}`);

            setJoinRequests((prev) =>
              prev.filter((request) => request.userId !== userId),
            );
          },
        );

        // ==========================================
        // HOST REJECTED REQUEST
        // ==========================================
        socket.on(
          "join-request-rejected",
          ({ userId, userName: rejectedUserName }) => {
            if (!isHost) {
              return;
            }

            console.log(`❌ Rejected ${rejectedUserName}`);

            setJoinRequests((prev) =>
              prev.filter((request) => request.userId !== userId),
            );
          },
        );

        // ==========================================
        // APPROVAL ERROR
        // ==========================================
        socket.on("approval-error", ({ message }) => {
          console.error("❌ Approval error:", message);

          alert(message || "Unable to process request.");
        });

        // ==========================================
        // EXISTING USERS
        // ==========================================
        socket.on("all-users", ({ users }) => {
          console.log("👥 Existing users:", users);

          users.forEach((user) => {
            const userId = user.userId;

            const participantName = user.userName || "Guest";

            const exists = peersRef.current.some(
              (item) => item.peerID === userId,
            );

            if (exists) {
              return;
            }

            const peer = createInitiatorPeer(userId, stream);

            addPeer(
              userId,
              peer,
              participantName,
              user.audio ?? true,
              user.video ?? true,
            );
          });
        });

        // ==========================================
        // NEW USER JOINED
        // ==========================================
        socket.on(
          "user-joined",
          ({ userId, userName: participantName, audio, video }) => {
            console.log("🆕 New user joined:", participantName);

            const exists = peersRef.current.some(
              (item) => item.peerID === userId,
            );

            if (exists) {
              return;
            }

            const peer = createReceiverPeer(userId, stream);

            addPeer(
              userId,
              peer,
              participantName || "Guest",
              audio ?? true,
              video ?? true,
            );
          },
        );

        // ==========================================
        // WEBRTC SIGNAL
        // ==========================================
        socket.on("user-signal", ({ from, signal }) => {
          let item = peersRef.current.find((p) => p.peerID === from);

          if (!item) {
            const peer = createReceiverPeer(from, stream);

            addPeer(from, peer, "Guest", true, true);

            item = peersRef.current.find((p) => p.peerID === from);
          }

          if (item?.peer && !item.peer.destroyed) {
            try {
              item.peer.signal(signal);
            } catch (error) {
              console.warn("⚠️ Signal error:", error.message);
            }
          }
        });

        // ==========================================
        // RETURN SIGNAL
        // ==========================================
        socket.on("receiving-returned-signal", ({ from, signal }) => {
          const item = peersRef.current.find((p) => p.peerID === from);

          if (item?.peer && !item.peer.destroyed) {
            try {
              item.peer.signal(signal);
            } catch (error) {
              console.warn("⚠️ Return signal error:", error.message);
            }
          }
        });

        // ==========================================
        // USER LEFT
        // ==========================================
        socket.on("user-left", (id) => {
          console.log("🔴 User left:", id);

          removePeer(id);
        });

        // ==========================================
        // REAL-TIME MEDIA STATUS
        // ==========================================
        socket.on("media-status", ({ userId, audio, video }) => {
          console.log("📡 Media status received:", {
            userId,
            audio,
            video,
          });

          peersRef.current = peersRef.current.map((item) => {
            if (item.peerID === userId) {
              return {
                ...item,
                audio: typeof audio === "boolean" ? audio : item.audio,
                video: typeof video === "boolean" ? video : item.video,
              };
            }

            return item;
          });

          setPeers((prev) =>
            prev.map((item) => {
              if (item.id === userId) {
                return {
                  ...item,
                  audio: typeof audio === "boolean" ? audio : item.audio,
                  video: typeof video === "boolean" ? video : item.video,
                };
              }

              return item;
            }),
          );
        });

        // ==========================================
        // CHAT
        // ==========================================
        socket.on("chat-message", (data) => {
          setMessages((prev) => [...prev, data]);
        });
      } catch (error) {
        console.error("❌ Media device error:", error);

        alert("Please allow camera and microphone permissions.");
      }
    };

    startMeeting();

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      mounted = false;

      socket.emit("leave-room", {
        roomId,
      });

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());

        screenStreamRef.current = null;
      }

      screenTrackRef.current = null;

      peersRef.current.forEach((item) => {
        if (item.peer && !item.peer.destroyed) {
          item.peer.destroy();
        }
      });

      peersRef.current = [];

      setPeers([]);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());

        localStreamRef.current = null;
      }

      cameraTrackRef.current = null;

      socket.off("all-users");
      socket.off("user-joined");
      socket.off("user-signal");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
      socket.off("chat-message");
      socket.off("media-status");

      socket.off("join-request");
      socket.off("join-request-approved");
      socket.off("join-request-rejected");
      socket.off("join-approved");
      socket.off("join-rejected");
      socket.off("join-request-pending");
      socket.off("approval-error");
    };
  }, [roomId, userName, isHost]);

  // ==========================================
  // APPROVE REQUEST
  // ==========================================
  const approveJoinRequest = (request) => {
    console.log("✅ Approving:", request.userName);

    socket.emit("approve-join-request", {
      roomId,
      userId: request.userId,
    });
  };

  // ==========================================
  // REJECT REQUEST
  // ==========================================
  const rejectJoinRequest = (request) => {
    console.log("❌ Rejecting:", request.userName);

    socket.emit("reject-join-request", {
      roomId,
      userId: request.userId,
    });
  };

  // ==========================================
  // INITIATOR PEER
  // ==========================================
  const createInitiatorPeer = (userToSignal, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        to: userToSignal,
        signal,
      });
    });

    peer.on("error", (error) => {
      console.warn("⚠️ Initiator peer error:", error.message);
    });

    return peer;
  };

  // ==========================================
  // RECEIVER PEER
  // ==========================================
  const createReceiverPeer = (userId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", {
        to: userId,
        signal,
      });
    });

    peer.on("error", (error) => {
      console.warn("⚠️ Receiver peer error:", error.message);
    });

    return peer;
  };

  // ==========================================
  // CHAT
  // ==========================================
  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    socket.emit("chat-message", {
      roomId,
      message: message.trim(),
      sender: userName,
    });

    setMessage("");
  };

  // ==========================================
  // SEND MEDIA STATUS
  // ==========================================
  const sendMediaStatus = (audioStatus, videoStatus) => {
    const payload = {
      roomId,
      audio: audioStatus,
      video: videoStatus,
    };

    console.log("📡 Sending media status:", payload);

    console.log("🔌 Socket connected:", socket.connected);

    socket.emit("media-status", payload, (response) => {
      console.log("📨 Media status acknowledgement:", response);
    });
  };

  // ==========================================
  // TOGGLE MICROPHONE
  // ==========================================
  const toggleMute = () => {
    if (!localStreamRef.current) {
      console.warn("⚠️ Local stream not available");

      return;
    }

    const track = localStreamRef.current.getAudioTracks()[0];

    if (!track) {
      console.warn("⚠️ Audio track not found");

      return;
    }

    track.enabled = !track.enabled;

    const muted = !track.enabled;

    setIsMuted(muted);

    console.log(muted ? "🔇 Microphone OFF" : "🎙️ Microphone ON");

    sendMediaStatus(!muted, !isCameraOff);
  };

  // ==========================================
  // TOGGLE CAMERA
  // ==========================================
  const toggleCamera = () => {
    if (!localStreamRef.current) {
      console.warn("⚠️ Local stream not available");

      return;
    }

    const track = localStreamRef.current.getVideoTracks()[0];

    if (!track) {
      console.warn("⚠️ Video track not found");

      return;
    }

    track.enabled = !track.enabled;

    const cameraOff = !track.enabled;

    setIsCameraOff(cameraOff);

    console.log(cameraOff ? "📷 Camera OFF" : "📷 Camera ON");

    sendMediaStatus(!isMuted, !cameraOff);
  };

  // ==========================================
  // START SCREEN SHARING
  // ==========================================
  const startScreenShare = async () => {
    try {
      if (isScreenSharing) {
        return;
      }

      if (!localStreamRef.current) {
        console.warn("⚠️ Local stream not available");

        return;
      }

      console.log("🖥️ Requesting screen sharing...");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        console.warn("⚠️ Screen track not found");

        return;
      }

      screenStreamRef.current = screenStream;

      screenTrackRef.current = screenTrack;

      const cameraTrack =
        cameraTrackRef.current || localStreamRef.current.getVideoTracks()[0];

      if (!cameraTrack) {
        console.warn("⚠️ Camera track not found");

        screenTrack.stop();

        return;
      }

      // ==========================================
      // REPLACE CAMERA TRACK WITH SCREEN TRACK
      // ==========================================
      peersRef.current.forEach((item) => {
        if (item.peer && !item.peer.destroyed) {
          try {
            item.peer.replaceTrack(
              cameraTrack,
              screenTrack,
              localStreamRef.current,
            );

            console.log(
              "🔄 Camera track replaced with screen for:",
              item.userName,
            );
          } catch (error) {
            console.warn("⚠️ replaceTrack error:", error.message);
          }
        }
      });

      if (userVideo.current) {
        userVideo.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      console.log("🖥️ Screen sharing started");

      screenTrack.onended = () => {
        console.log("⛔ Screen sharing stopped from browser");

        stopScreenShare();
      };
    } catch (error) {
      console.error("❌ Screen sharing error:", error);

      if (error.name === "NotAllowedError") {
        console.log("ℹ️ Screen sharing permission cancelled.");
      }
    }
  };

  // ==========================================
  // STOP SCREEN SHARING
  // ==========================================
  const stopScreenShare = () => {
    const screenStream = screenStreamRef.current;

    const screenTrack = screenTrackRef.current;

    const cameraTrack =
      cameraTrackRef.current || localStreamRef.current?.getVideoTracks()[0];

    if (!cameraTrack) {
      console.warn("⚠️ Camera track not available");

      return;
    }

    peersRef.current.forEach((item) => {
      if (item.peer && !item.peer.destroyed) {
        try {
          if (screenTrack) {
            item.peer.replaceTrack(
              screenTrack,
              cameraTrack,
              localStreamRef.current,
            );
          }

          console.log("🔄 Screen replaced with camera for:", item.userName);
        } catch (error) {
          console.warn("⚠️ Camera restore error:", error.message);
        }
      }
    });

    if (userVideo.current && localStreamRef.current) {
      userVideo.current.srcObject = localStreamRef.current;
    }

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    screenStreamRef.current = null;

    screenTrackRef.current = null;

    setIsScreenSharing(false);

    console.log("⛔ Screen sharing stopped");
  };

  // ==========================================
  // PARTICIPANT COUNT
  // ==========================================
  const participantCount = peers.length + 1;

  // ==========================================
  // RESPONSIVE GRID
  // ==========================================
  let columns = 1;

  if (participantCount === 1) {
    columns = 1;
  } else if (participantCount <= 4) {
    columns = 2;
  } else if (participantCount <= 9) {
    columns = 3;
  } else {
    columns = 4;
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #081229, #0B0F1A)",
        color: "#fff",
        padding: "20px",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ==========================================
          GUEST WAITING / REJECTED SCREEN
      ========================================== */}
      {!isHost && joinStatus !== "approved" && (
        <div
          style={{
            minHeight: "calc(100vh - 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "rgba(8,18,41,0.95)",
              border: "1px solid rgba(0,191,255,0.25)",
              borderRadius: "20px",
              padding: "35px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "18px",
              }}
            >
              {joinStatus === "rejected" ? "❌" : "⏳"}
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                color: joinStatus === "rejected" ? "#ff5b5b" : "#00BFFF",
              }}
            >
              {joinStatus === "rejected"
                ? "Request Rejected"
                : "Waiting for Host"}
            </h2>

            <p
              style={{
                color: "#aab4c5",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              {joinMessage}
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
                padding: "10px",
                color: "#777",
                fontSize: "0.85rem",
              }}
            >
              Meeting: {roomId}
            </div>

            {joinStatus === "rejected" && (
              <button
                onClick={() => {
                  window.location.href = "/home";
                }}
                style={{
                  marginTop: "20px",
                  background: "#00BFFF",
                  color: "#fff",
                  border: "none",
                  padding: "11px 22px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          ACTUAL MEETING
      ========================================== */}
      {(isHost || joinStatus === "approved") && (
        <>
          {/* HEADER */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            <h1
              style={{
                margin: 0,
                color: "#00BFFF",
                fontSize: "clamp(1.5rem, 3vw, 2.3rem)",
                fontWeight: "800",
              }}
            >
              Room: {roomId}
            </h1>

            <div
              style={{
                marginTop: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "18px",
                flexWrap: "wrap",
                color: "#ccc",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              <span>👥 Participants: {participantCount}</span>

              <span
                style={{
                  background: "rgba(0, 191, 255, 0.12)",
                  border: "1px solid rgba(0, 191, 255, 0.45)",
                  color: "#00BFFF",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  boxShadow: "0 0 10px rgba(0, 191, 255, 0.15)",
                }}
              >
                ⏱️ {formatMeetingTime(meetingSeconds)}
              </span>
            </div>
          </div>

          {/* ==========================================
              HOST JOIN REQUEST PANEL
          ========================================== */}
          {isHost && joinRequests.length > 0 && (
            <div
              style={{
                width: "100%",
                maxWidth: "520px",
                margin: "0 auto 18px",
                background: "rgba(17,24,39,0.96)",
                border: "1px solid rgba(0,191,255,0.35)",
                borderRadius: "16px",
                padding: "18px",
                boxShadow: "0 15px 45px rgba(0,0,0,0.35)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px",
                  color: "#00BFFF",
                }}
              >
                🔔 Join Requests
              </h3>

              {joinRequests.map((request) => (
                <div
                  key={request.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "12px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "700",
                      }}
                    >
                      {request.userName}
                    </div>

                    <div
                      style={{
                        color: "#888",
                        fontSize: "0.8rem",
                        marginTop: "3px",
                      }}
                    >
                      Wants to join
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => approveJoinRequest(request)}
                      style={{
                        border: "none",
                        background: "#20c997",
                        color: "#fff",
                        padding: "8px 13px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        fontWeight: "700",
                      }}
                    >
                      ✓ Allow
                    </button>

                    <button
                      onClick={() => rejectJoinRequest(request)}
                      style={{
                        border: "none",
                        background: "#ff4d4d",
                        color: "#fff",
                        padding: "8px 13px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        fontWeight: "700",
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIDEO GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: "12px",
              width: "100%",
              maxWidth: "1600px",
              margin: "0 auto",
              alignItems: "center",
            }}
          >
            <VideoCard
              videoRef={userVideo}
              userName={userName}
              isMuted={isMuted}
              isCameraOff={isCameraOff && !isScreenSharing}
              isScreenSharing={isScreenSharing}
            />

            {peers.map((item) => (
              <Video
                key={item.id}
                peer={item.peer}
                userName={item.userName}
                isMuted={!item.audio}
                isCameraOff={!item.video}
              />
            ))}
          </div>

          {/* CONTROLS */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <button
              onClick={toggleMute}
              style={buttonStyle(isMuted ? "#555" : "#00BFFF")}
            >
              {isMuted ? "🔇 Unmute" : "🎙 Mute"}
            </button>

            <button
              onClick={toggleCamera}
              disabled={isScreenSharing}
              style={{
                ...buttonStyle(isCameraOff ? "#555" : "#00BFFF"),
                opacity: isScreenSharing ? 0.5 : 1,
                cursor: isScreenSharing ? "not-allowed" : "pointer",
              }}
            >
              {isCameraOff ? "📷 Camera On" : "🎥 Camera Off"}
            </button>

            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              style={buttonStyle(isScreenSharing ? "#FF9800" : "#00BFFF")}
            >
              {isScreenSharing ? "⛔ Stop Sharing" : "🖥️ Share Screen"}
            </button>

            {/* SHARE MEETING */}
            <button
              onClick={() => setShareOpen(true)}
              style={buttonStyle("#00BFFF")}
            >
              🔗 Share Meeting
            </button>

            {/* LEAVE */}
            <button
              onClick={() => {
                if (screenStreamRef.current) {
                  screenStreamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
                }

                if (localStreamRef.current) {
                  localStreamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
                }

                socket.emit("leave-room", {
                  roomId,
                });

                window.location.href = "/home";
              }}
              style={buttonStyle("#FF4B4B")}
            >
              🚪 Leave Meeting
            </button>
          </div>

          {/* SHARE MEETING MODAL */}
          <ShareMeeting
            roomId={roomId}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
          />

          {/* CHAT BUTTON */}
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              style={{
                position: "fixed",
                right: "25px",
                bottom: "25px",
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                border: "none",
                background: "#00BFFF",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0,191,255,0.6)",
                zIndex: 1000,
              }}
            >
              <MessageCircle size={28} />
            </button>
          )}

          {/* CHAT PANEL */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: chatOpen ? 0 : "-340px",
              width: "320px",
              maxWidth: "90vw",
              height: "100vh",
              background: "#111827",
              borderLeft: "2px solid #00BFFF",
              display: "flex",
              flexDirection: "column",
              transition: "right 0.35s ease",
              zIndex: 2000,
            }}
          >
            <div
              style={{
                background: "#00BFFF",
                padding: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "700",
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
                padding: "12px",
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    textAlign: msg.sender === userName ? "right" : "left",
                  }}
                >
                  <b
                    style={{
                      color: "#00BFFF",
                    }}
                  >
                    {msg.sender}:
                  </b>{" "}
                  {msg.message}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                borderTop: "1px solid #00BFFF",
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#0B1120",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                }}
              />

              <button
                onClick={sendMessage}
                style={{
                  background: "#00BFFF",
                  color: "#fff",
                  border: "none",
                  padding: "0 16px",
                  cursor: "pointer",
                }}
              >
                ➤
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <p
            style={{
              textAlign: "center",
              color: "#777",
              marginTop: "12px",
              fontSize: "0.8rem",
            }}
          >
            NovaMeet Project 🚀
          </p>
        </>
      )}
    </div>
  );
}

// ==========================================
// LOCAL VIDEO CARD
// ==========================================
function VideoCard({
  videoRef,
  userName,
  isMuted,
  isCameraOff,
  isScreenSharing,
}) {
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          objectFit: "cover",
          display: "block",
          border: "2px solid #00BFFF",
          boxSizing: "border-box",
          background: "#000",
        }}
      />

      <div style={nameBadgeStyle}>
        {isMuted ? "🔇" : "🎙️"} {userName}
      </div>

      {isScreenSharing && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0,191,255,0.9)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: "700",
          }}
        >
          🖥️ You are sharing
        </div>
      )}

      {isCameraOff && !isScreenSharing && (
        <div style={cameraOffStyle}>📷 Camera Off</div>
      )}
    </div>
  );
}

// ==========================================
// REMOTE VIDEO
// ==========================================
function Video({ peer, userName, isMuted, isCameraOff }) {
  const ref = useRef();

  useEffect(() => {
    const handleStream = (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    };

    peer.on("stream", handleStream);

    return () => {
      peer.removeListener("stream", handleStream);
    };
  }, [peer]);

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <video
        ref={ref}
        playsInline
        autoPlay
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          objectFit: "cover",
          display: "block",
          border: "2px solid #00BFFF",
          boxSizing: "border-box",
          background: "#000",
        }}
      />

      <div style={nameBadgeStyle}>
        {isMuted ? "🔇" : "🎙️"} {userName}
      </div>

      {isCameraOff && <div style={cameraOffStyle}>📷 Camera Off</div>}
    </div>
  );
}

// ==========================================
// BUTTON STYLE
// ==========================================
function buttonStyle(color) {
  return {
    background: color,
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    boxShadow: "0 0 10px rgba(0,191,255,0.4)",
  };
}

// ==========================================
// NAME BADGE
// ==========================================
const nameBadgeStyle = {
  position: "absolute",
  left: "10px",
  bottom: "10px",
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "6px",
  fontSize: "0.9rem",
  fontWeight: "600",
  backdropFilter: "blur(5px)",
};

// ==========================================
// CAMERA OFF
// ==========================================
const cameraOffStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "8px",
  fontSize: "0.9rem",
  fontWeight: "600",
  whiteSpace: "nowrap",
};
