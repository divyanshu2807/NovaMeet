import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import server from "../environment";

function HomeComponent() {
  const navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [joining, setJoining] = useState(false);

  const {
    addToUserHistory,
    logout,
  } = useContext(AuthContext);

  // ==========================================
  // GET CURRENT USER
  // ==========================================
  const getCurrentUser = () => {
    const userData =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(
        localStorage.getItem("nova_user")
      );

    return userData?.name || "Guest";
  };

  // ==========================================
  // JOIN EXISTING MEETING
  // ==========================================
  const handleJoinVideoCall = async () => {
    const cleanMeetingCode =
      meetingCode.trim();

    if (!cleanMeetingCode) {
      alert(
        "Please enter a valid meeting code!"
      );
      return;
    }

    if (joining) return;

    setJoining(true);

    try {
      // ==========================================
      // CHECK WHETHER MEETING EXISTS
      // ==========================================
      const response = await axios.get(
        `${server}/api/v1/meetings/${encodeURIComponent(
          cleanMeetingCode
        )}`
      );

      const meeting =
        response?.data?.meeting;

      if (!meeting) {
        alert("Meeting not found.");
        setJoining(false);
        return;
      }

      // ==========================================
      // GET CURRENT USER
      // ==========================================
      const userName =
        getCurrentUser();

      // ==========================================
      // ADD TO EXISTING HISTORY
      // ==========================================
      await addToUserHistory(
        cleanMeetingCode
      );

      // ==========================================
      // IMPORTANT:
      // DO NOT JOIN SOCKET ROOM HERE
      //
      // VideoMeet.jsx will handle the socket
      // connection after its listeners are ready.
      // Guest will send a join request there.
      // ==========================================

      // ==========================================
      // OPEN MEETING
      // ==========================================
      navigate(
        `/meet/${cleanMeetingCode}`,
        {
          state: {
            meetingCode:
              cleanMeetingCode,

            userName,

            meetingTitle:
              meeting.title,

            // Guest
            isHost: false,
          },
        }
      );
    } catch (error) {
      console.error(
        "❌ Join Meeting Error:",
        error
      );

      if (
        error?.response?.status === 404
      ) {
        alert(
          "Meeting not found. Please check the meeting code."
        );
      } else if (
        error?.response?.status === 410
      ) {
        alert(
          "This meeting has already ended."
        );
      } else {
        alert(
          error?.response?.data?.message ||
            "Unable to join the meeting. Please try again."
        );
      }
    } finally {
      setJoining(false);
    }
  };

  // ==========================================
  // CREATE NEW MEETING
  // ==========================================
  const handleCreateMeeting = () => {
    navigate("/create-meeting");
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    logout();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #071522 0%, #0b1020 45%, #120b2b 100%)",
        color: "#fff",
        boxSizing: "border-box",
      }}
    >
      {/* ==========================================
          NAVBAR
      ========================================== */}
      <div
        className="navBar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 45px",
          background:
            "rgba(0, 0, 0, 0.78)",
          boxShadow:
            "0 2px 18px rgba(0, 0, 0, 0.55)",
          borderBottom:
            "1px solid rgba(0,191,255,0.08)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() =>
            navigate("/home")
          }
        >
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: "900",
              background:
                "linear-gradient(90deg, #00bfff, #0077ff)",
              WebkitBackgroundClip:
                "text",
              WebkitTextFillColor:
                "transparent",
              letterSpacing: "1px",
              fontFamily:
                "'Poppins', sans-serif",
              margin: 0,
            }}
          >
            NovaMeet
          </h1>
        </div>

        {/* NAV RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <IconButton
            onClick={() =>
              navigate("/history")
            }
            sx={{
              background:
                "rgba(255,255,255,0.08)",
              width: "46px",
              height: "46px",
              "&:hover": {
                background:
                  "rgba(0,191,255,0.14)",
              },
            }}
          >
            <RestoreIcon
              sx={{
                color: "#00bfff",
                fontSize: "25px",
              }}
            />
          </IconButton>

          <p
            onClick={() =>
              navigate("/history")
            }
            style={{
              cursor: "pointer",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1.05rem",
              margin: 0,
            }}
          >
            History
          </p>

          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            disabled={loggingOut}
            sx={{
              borderColor:
                "#ff4d4d",
              color: "#ff4d4d",
              fontWeight: "600",
              borderRadius: "8px",
              padding: "7px 17px",
              "&:hover": {
                backgroundColor:
                  "rgba(255,77,77,0.1)",
              },
            }}
          >
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </Button>
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding:
            "42px 30px 55px",
          boxSizing:
            "border-box",
        }}
      >
        {/* ==========================================
            HERO
        ========================================== */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "34px",
          }}
        >
          <div
            style={{
              display:
                "inline-block",
              padding: "6px 15px",
              borderRadius: "30px",
              background:
                "rgba(0,191,255,0.08)",
              border:
                "1px solid rgba(0,191,255,0.22)",
              color: "#00bfff",
              fontSize: "0.78rem",
              fontWeight: "700",
              letterSpacing:
                "0.8px",
              marginBottom: "13px",
            }}
          >
            VIDEO MEETINGS • SIMPLE • FAST
          </div>

          <h1
            style={{
              fontSize:
                "clamp(2.1rem, 4vw, 3.35rem)",
              fontWeight: "800",
              lineHeight: "1.08",
              margin:
                "0 auto 12px",
              maxWidth: "900px",
              letterSpacing:
                "-1px",
            }}
          >
            Connect. Collaborate.{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #00bfff, #0077ff)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
              }}
            >
              Create.
            </span>
          </h1>

          <p
            style={{
              color: "#9ca8bb",
              fontSize: "1rem",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: "1.55",
            }}
          >
            Start a new meeting or join
            an existing NovaMeet
            session using your meeting
            code.
          </p>
        </div>

        {/* ==========================================
            ACTION CARDS
        ========================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "26px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* CREATE MEETING */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(0,191,255,0.10), rgba(0,0,0,0.42))",
              border:
                "1px solid rgba(0,191,255,0.25)",
              borderRadius: "20px",
              padding: "28px",
              minHeight: "315px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent:
                "space-between",
              boxShadow:
                "0 15px 40px rgba(0,0,0,0.25)",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 20px 50px rgba(0,191,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 15px 40px rgba(0,0,0,0.25)";
            }}
          >
            <div>
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  background:
                    "rgba(0,191,255,0.12)",
                  border:
                    "1px solid rgba(0,191,255,0.25)",
                  fontSize: "26px",
                  marginBottom:
                    "18px",
                }}
              >
                🎥
              </div>

              <h2
                style={{
                  fontSize: "1.55rem",
                  margin:
                    "0 0 9px",
                  fontWeight: "750",
                }}
              >
                Create Meeting
              </h2>

              <p
                style={{
                  color: "#9ca8bb",
                  lineHeight:
                    "1.55",
                  margin: 0,
                  fontSize:
                    "0.98rem",
                }}
              >
                Start a new meeting,
                add a title and
                invite your
                participants.
              </p>
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={
                handleCreateMeeting
              }
              sx={{
                marginTop:
                  "24px",
                background:
                  "linear-gradient(90deg, #00bfff, #0077ff)",
                color: "#fff",
                fontWeight: "800",
                fontSize:
                  "0.98rem",
                padding: "11px",
                borderRadius:
                  "10px",
                boxShadow:
                  "0 8px 22px rgba(0,191,255,0.18)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #00aaff, #0066ff)",
                  boxShadow:
                    "0 10px 28px rgba(0,191,255,0.28)",
                },
              }}
            >
              CREATE MEETING
            </Button>
          </div>

          {/* JOIN MEETING */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(138,43,226,0.09), rgba(0,0,0,0.42))",
              border:
                "1px solid rgba(138,43,226,0.25)",
              borderRadius: "20px",
              padding: "28px",
              minHeight: "315px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent:
                "space-between",
              boxShadow:
                "0 15px 40px rgba(0,0,0,0.25)",
              transition:
                "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 20px 50px rgba(138,43,226,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 15px 40px rgba(0,0,0,0.25)";
            }}
          >
            <div>
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  background:
                    "rgba(138,43,226,0.12)",
                  border:
                    "1px solid rgba(138,43,226,0.25)",
                  fontSize: "26px",
                  marginBottom:
                    "18px",
                }}
              >
                🔗
              </div>

              <h2
                style={{
                  fontSize: "1.55rem",
                  margin:
                    "0 0 9px",
                  fontWeight: "750",
                }}
              >
                Join Meeting
              </h2>

              <p
                style={{
                  color: "#9ca8bb",
                  lineHeight:
                    "1.55",
                  margin: 0,
                  fontSize:
                    "0.98rem",
                }}
              >
                Enter the meeting
                code shared by your
                host to join the
                session.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems:
                  "stretch",
                marginTop:
                  "24px",
              }}
            >
              <TextField
                fullWidth
                value={meetingCode}
                onChange={(e) =>
                  setMeetingCode(
                    e.target.value
                  )
                }
                placeholder="Enter meeting code"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      background:
                        "rgba(0,0,0,0.28)",
                      borderRadius:
                        "10px",

                      "& fieldset": {
                        borderColor:
                          "rgba(255,255,255,0.16)",
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

                  input: {
                    color: "#fff",
                    fontWeight:
                      "500",
                    fontSize:
                      "0.95rem",
                  },

                  "& input::placeholder":
                    {
                      color:
                        "#8b8b96",
                      opacity: 1,
                    },
                }}
              />

              <Button
                variant="contained"
                onClick={
                  handleJoinVideoCall
                }
                disabled={joining}
                sx={{
                  minWidth:
                    "100px",
                  background:
                    "linear-gradient(90deg, #00bfff, #0077ff)",
                  color: "#fff",
                  fontWeight:
                    "800",
                  borderRadius:
                    "10px",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, #00aaff, #0066ff)",
                  },
                }}
              >
                {joining
                  ? "CHECKING..."
                  : "JOIN"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(
  HomeComponent
);