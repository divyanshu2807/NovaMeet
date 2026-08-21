import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField } from "@mui/material";
import axios from "axios";
import "../App.css";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";
import server from "../environment";

function CreateMeeting() {
  const navigate = useNavigate();
  const { addToUserHistory } = useAuth();

  const [hostName, setHostName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Meeting information after creation
  const [createdMeeting, setCreatedMeeting] =
    useState(null);

  const [copied, setCopied] = useState(false);

  // ==========================================
  // CREATE UNIQUE MEETING ID
  // ==========================================
  const generateMeetingId = () => {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const timePart = Date.now()
      .toString(36)
      .slice(-4)
      .toUpperCase();

    return `NM-${randomPart}-${timePart}`;
  };

  // ==========================================
  // GET CURRENT USER ID
  // ==========================================
  const getCurrentUserId = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      const user =
        JSON.parse(storedUser);

      return user?.id || null;
    } catch (error) {
      console.error(
        "❌ Unable to read current user:",
        error
      );

      return null;
    }
  };

  // ==========================================
  // CREATE MEETING
  // ==========================================
  const handleCreateMeeting = async () => {
    const cleanName =
      hostName.trim();

    const cleanTitle =
      meetingTitle.trim();

    if (!cleanName) {
      alert("Please enter your name.");
      return;
    }

    if (!cleanTitle) {
      alert(
        "Please enter a meeting title."
      );
      return;
    }

    if (creating) return;

    setCreating(true);

    try {
      const meetingId =
        generateMeetingId();

      const hostUserId =
        getCurrentUserId();

      // ==========================================
      // SAVE MEETING TO BACKEND / MONGODB
      // ==========================================
      const response =
        await axios.post(
          `${server}/api/v1/meetings`,
          {
            meetingCode:
              meetingId,

            title:
              cleanTitle,

            hostName:
              cleanName,

            hostUserId:
              hostUserId,
          }
        );

      console.log(
        "🟢 Backend meeting response:",
        response.data
      );

      const savedMeeting =
        response?.data?.meeting;

      if (!savedMeeting) {
        throw new Error(
          "Meeting was not created on the server."
        );
      }

      // ==========================================
      // SAVE TO EXISTING USER HISTORY
      // ==========================================
      await addToUserHistory(
        meetingId
      );

      // ==========================================
      // CREATE SHARE LINK
      // ==========================================
      const meetingLink =
        `${window.location.origin}/meet/${meetingId}`;

      console.log(
        "🆕 NovaMeet created:",
        {
          meetingId,
          meetingTitle:
            cleanTitle,
          hostName:
            cleanName,
          hostUserId,
        }
      );

      // ==========================================
      // STORE MEETING INFORMATION
      // ==========================================
      setCreatedMeeting({
        meetingId:
          savedMeeting.meetingCode ||
          meetingId,

        meetingTitle:
          savedMeeting.title ||
          cleanTitle,

        hostName:
          savedMeeting.hostName ||
          cleanName,

        hostUserId:
          savedMeeting.hostUserId ||
          hostUserId,

        meetingLink,
      });

      setCreating(false);
    } catch (error) {
      console.error(
        "❌ Meeting creation failed:",
        error
      );

      console.error(
        "❌ Backend response:",
        error?.response?.data
      );

      if (
        error?.response?.status ===
        409
      ) {
        alert(
          "This meeting code already exists. Please try again."
        );
      } else if (
        error?.response?.status ===
        401
      ) {
        alert(
          "Your session has expired. Please login again."
        );
      } else {
        alert(
          error?.response?.data?.message ||
            "Unable to create the meeting. Please try again."
        );
      }

      setCreating(false);
    }
  };

  // ==========================================
  // COPY MEETING LINK
  // ==========================================
  const handleCopyLink =
    async () => {
      if (
        !createdMeeting?.meetingLink
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          createdMeeting.meetingLink
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (error) {
        console.error(
          "❌ Failed to copy meeting link:",
          error
        );

        alert(
          "Unable to copy the meeting link."
        );
      }
    };

  // ==========================================
  // WHATSAPP SHARE
  // ==========================================
  const handleWhatsAppShare =
    () => {
      if (!createdMeeting) {
        return;
      }

      const message =
        encodeURIComponent(
          `You're invited to join my NovaMeet meeting.\n\n` +
            `Meeting: ${createdMeeting.meetingTitle}\n` +
            `Meeting Code: ${createdMeeting.meetingId}\n\n` +
            `Join Meeting:\n${createdMeeting.meetingLink}`
        );

      window.open(
        `https://wa.me/?text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

  // ==========================================
  // TELEGRAM SHARE
  // ==========================================
  const handleTelegramShare =
    () => {
      if (!createdMeeting) {
        return;
      }

      const message =
        encodeURIComponent(
          `You're invited to join my NovaMeet meeting.\n\n` +
            `Meeting: ${createdMeeting.meetingTitle}\n` +
            `Meeting Code: ${createdMeeting.meetingId}`
        );

      const url =
        encodeURIComponent(
          createdMeeting.meetingLink
        );

      window.open(
        `https://t.me/share/url?url=${url}&text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

  // ==========================================
  // EMAIL SHARE
  // ==========================================
  const handleEmailShare =
    () => {
      if (!createdMeeting) {
        return;
      }

      const subject =
        encodeURIComponent(
          `NovaMeet Meeting Invitation - ${createdMeeting.meetingTitle}`
        );

      const body =
        encodeURIComponent(
          `Hi,\n\n` +
            `You are invited to join a NovaMeet meeting.\n\n` +
            `Meeting: ${createdMeeting.meetingTitle}\n` +
            `Host: ${createdMeeting.hostName}\n` +
            `Meeting Code: ${createdMeeting.meetingId}\n\n` +
            `Join Meeting:\n${createdMeeting.meetingLink}\n\n` +
            `See you there!`
        );

      window.location.href =
        `mailto:?subject=${subject}&body=${body}`;
    };

  // ==========================================
  // ENTER CREATED MEETING
  // ==========================================
  const handleEnterMeeting =
    () => {
      if (!createdMeeting) {
        return;
      }

      navigate(
        `/meet/${createdMeeting.meetingId}`,
        {
          state: {
            meetingCode:
              createdMeeting.meetingId,

            userName:
              createdMeeting.hostName,

            meetingTitle:
              createdMeeting.meetingTitle,

            isHost: true,
          },
        }
      );
    };

  // ==========================================
  // SHARE BUTTON STYLE
  // ==========================================
  const shareButtonStyle = {
    flex: "1 1 130px",
    minWidth: "120px",
    padding: "11px 14px",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F1A",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background:
            "rgba(0,0,0,0.55)",
          border:
            "1px solid rgba(0,191,255,0.25)",
          borderRadius: "18px",
          padding: "35px",
          boxSizing: "border-box",
          boxShadow:
            "0 0 35px rgba(0,191,255,0.12)",
        }}
      >
        {!createdMeeting ? (
          <>
            {/* CREATE MEETING FORM */}

            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  fontWeight: "800",
                  background:
                    "linear-gradient(90deg, #00bfff, #0077ff)",
                  WebkitBackgroundClip:
                    "text",
                  WebkitTextFillColor:
                    "transparent",
                }}
              >
                Create a Meeting
              </h1>

              <p
                style={{
                  color: "#aaa",
                  marginTop: "10px",
                  fontSize: "0.95rem",
                }}
              >
                Set up your NovaMeet
                session
              </p>
            </div>

            {/* HOST NAME */}
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <TextField
                fullWidth
                label="Host Name"
                value={hostName}
                onChange={(e) =>
                  setHostName(
                    e.target.value
                  )
                }
                variant="outlined"
                sx={{
                  input: {
                    color: "#fff",
                  },

                  label: {
                    color: "#aaa",
                  },

                  "& .MuiOutlinedInput-root":
                    {
                      "& fieldset": {
                        borderColor:
                          "rgba(255,255,255,0.25)",
                      },

                      "&:hover fieldset":
                        {
                          borderColor:
                            "#00bfff",
                        },

                      "&.Mui-focused fieldset":
                        {
                          borderColor:
                            "#00bfff",
                        },
                    },

                  "& .MuiInputLabel-root.Mui-focused":
                    {
                      color:
                        "#00bfff",
                    },
                }}
              />
            </div>

            {/* MEETING TITLE */}
            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <TextField
                fullWidth
                label="Meeting Title"
                value={meetingTitle}
                onChange={(e) =>
                  setMeetingTitle(
                    e.target.value
                  )
                }
                variant="outlined"
                placeholder="e.g. Project Discussion"
                sx={{
                  input: {
                    color: "#fff",
                  },

                  label: {
                    color: "#aaa",
                  },

                  "& .MuiOutlinedInput-root":
                    {
                      "& fieldset": {
                        borderColor:
                          "rgba(255,255,255,0.25)",
                      },

                      "&:hover fieldset":
                        {
                          borderColor:
                            "#00bfff",
                        },

                      "&.Mui-focused fieldset":
                        {
                          borderColor:
                            "#00bfff",
                        },
                    },

                  "& .MuiInputLabel-root.Mui-focused":
                    {
                      color:
                        "#00bfff",
                    },
                }}
              />
            </div>

            {/* CREATE */}
            <Button
              fullWidth
              variant="contained"
              onClick={
                handleCreateMeeting
              }
              disabled={creating}
              sx={{
                background:
                  "linear-gradient(90deg, #00bfff, #0077ff)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "1.05rem",
                padding: "12px",
                borderRadius: "10px",

                "&:hover": {
                  background:
                    "linear-gradient(90deg, #00aaff, #0066ff)",
                },
              }}
            >
              {creating
                ? "Creating Meeting..."
                : "Create Meeting"}
            </Button>

            {/* BACK */}
            <Button
              fullWidth
              onClick={() =>
                navigate("/home")
              }
              sx={{
                marginTop: "12px",
                color: "#aaa",
                fontWeight: "600",

                "&:hover": {
                  color:
                    "#00bfff",
                },
              }}
            >
              ← Back to Home
            </Button>
          </>
        ) : (
          <>
            {/* SHARE MEETING PANEL */}

            <div
              style={{
                textAlign: "center",
              }}
            >
              {/* SUCCESS ICON */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin:
                    "0 auto 15px",
                  borderRadius:
                    "50%",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "rgba(0,191,255,0.12)",
                  border:
                    "1px solid rgba(0,191,255,0.35)",
                  fontSize: "30px",
                }}
              >
                🎉
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "1.9rem",
                  fontWeight: "800",
                  background:
                    "linear-gradient(90deg, #00bfff, #0077ff)",
                  WebkitBackgroundClip:
                    "text",
                  WebkitTextFillColor:
                    "transparent",
                }}
              >
                Meeting Created!
              </h1>

              <p
                style={{
                  color: "#aaa",
                  marginTop: "10px",
                  marginBottom:
                    "25px",
                }}
              >
                Share the meeting
                with your
                participants.
              </p>

              {/* MEETING TITLE */}
              <div
                style={{
                  textAlign:
                    "left",
                  padding: "15px",
                  marginBottom:
                    "15px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,255,255,0.05)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    color: "#888",
                    fontSize:
                      "0.8rem",
                    marginBottom:
                      "5px",
                  }}
                >
                  MEETING TITLE
                </div>

                <div
                  style={{
                    fontWeight:
                      "700",
                    fontSize:
                      "1.05rem",
                  }}
                >
                  {
                    createdMeeting.meetingTitle
                  }
                </div>
              </div>

              {/* MEETING CODE */}
              <div
                style={{
                  textAlign:
                    "left",
                  padding: "15px",
                  marginBottom:
                    "15px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(0,191,255,0.08)",
                  border:
                    "1px solid rgba(0,191,255,0.2)",
                }}
              >
                <div
                  style={{
                    color: "#888",
                    fontSize:
                      "0.8rem",
                    marginBottom:
                      "5px",
                  }}
                >
                  MEETING CODE
                </div>

                <div
                  style={{
                    color:
                      "#00bfff",
                    fontWeight:
                      "800",
                    fontSize:
                      "1.2rem",
                    letterSpacing:
                      "1px",
                  }}
                >
                  {
                    createdMeeting.meetingId
                  }
                </div>
              </div>

              {/* MEETING LINK */}
              <div
                style={{
                  textAlign:
                    "left",
                  marginBottom:
                    "22px",
                }}
              >
                <div
                  style={{
                    color: "#aaa",
                    fontSize:
                      "0.85rem",
                    marginBottom:
                      "7px",
                  }}
                >
                  Meeting Link
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: "8px",
                  }}
                >
                  <input
                    value={
                      createdMeeting.meetingLink
                    }
                    readOnly
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background:
                        "rgba(255,255,255,0.05)",
                      border:
                        "1px solid rgba(255,255,255,0.15)",
                      borderRadius:
                        "8px",
                      padding:
                        "11px",
                      color:
                        "#ddd",
                      outline:
                        "none",
                      fontSize:
                        "0.85rem",
                    }}
                  />

                  <button
                    onClick={
                      handleCopyLink
                    }
                    style={{
                      background:
                        copied
                          ? "#00a86b"
                          : "linear-gradient(90deg, #00bfff, #0077ff)",
                      color:
                        "#fff",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      padding:
                        "0 15px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {copied
                      ? "Copied!"
                      : "Copy"}
                  </button>
                </div>
              </div>

              {/* SHARE */}
              <div
                style={{
                  color: "#aaa",
                  fontSize:
                    "0.9rem",
                  marginBottom:
                    "12px",
                  fontWeight:
                    "600",
                }}
              >
                Share via
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: "10px",
                  marginBottom:
                    "25px",
                }}
              >
                {/* WHATSAPP */}
                <button
                  onClick={
                    handleWhatsAppShare
                  }
                  style={{
                    ...shareButtonStyle,
                    background:
                      "rgba(37,211,102,0.12)",
                    border:
                      "1px solid rgba(37,211,102,0.5)",
                    color:
                      "#25d366",
                  }}
                >
                  🟢 WhatsApp
                </button>

                {/* TELEGRAM */}
                <button
                  onClick={
                    handleTelegramShare
                  }
                  style={{
                    ...shareButtonStyle,
                    background:
                      "rgba(0,136,204,0.12)",
                    border:
                      "1px solid rgba(0,136,204,0.5)",
                    color:
                      "#29a9ea",
                  }}
                >
                  ✈️ Telegram
                </button>

                {/* EMAIL */}
                <button
                  onClick={
                    handleEmailShare
                  }
                  style={{
                    ...shareButtonStyle,
                    background:
                      "rgba(255,255,255,0.06)",
                    border:
                      "1px solid rgba(255,255,255,0.2)",
                    color:
                      "#fff",
                  }}
                >
                  ✉️ Email
                </button>
              </div>

              {/* ENTER MEETING */}
              <Button
                fullWidth
                variant="contained"
                onClick={
                  handleEnterMeeting
                }
                sx={{
                  background:
                    "linear-gradient(90deg, #00bfff, #0077ff)",
                  color: "#fff",
                  fontWeight:
                    "700",
                  fontSize:
                    "1rem",
                  padding:
                    "12px",
                  borderRadius:
                    "10px",

                  "&:hover": {
                    background:
                      "linear-gradient(90deg, #00aaff, #0066ff)",
                  },
                }}
              >
                Enter Meeting
              </Button>

              {/* BACK HOME */}
              <Button
                fullWidth
                onClick={() =>
                  navigate("/home")
                }
                sx={{
                  marginTop:
                    "10px",
                  color:
                    "#aaa",
                  fontWeight:
                    "600",

                  "&:hover": {
                    color:
                      "#00bfff",
                  },
                }}
              >
                ← Back to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(
  CreateMeeting
);