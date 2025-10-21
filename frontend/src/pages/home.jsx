import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import socket from "../socketTest";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      alert("Please enter a valid meeting code!");
      return;
    }

    // ✅ Add to history
    await addToUserHistory(meetingCode);

    // ✅ Get current user info
    const userData = JSON.parse(localStorage.getItem("nova_user"));
    const userName = userData?.name || "Guest";

    // ✅ Emit join event to backend via socket
    socket.emit("join-room", { roomId: meetingCode, userName });

    // ✅ Redirect user to /meet/:roomId
    navigate(`/meet/${meetingCode}`, { state: { meetingCode, userName } });
  };

  return (
    <>
      {/* 🌐 Navbar */}
      <div
        className="navBar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 45px",
          background: "rgba(0, 0, 0, 0.7)",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* 🔹 Left - Textual Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/home")}
        >
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: "900",
              background: "linear-gradient(90deg, #00bfff, #0077ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "1.2px",
              fontFamily: "'Poppins', sans-serif",
              margin: 0,
            }}
          >
            NovaMeet
          </h1>
        </div>

        {/* 🔹 Right - Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <IconButton
            onClick={() => navigate("/history")}
            sx={{
              background: "rgba(255,255,255,0.1)",
              "&:hover": { background: "rgba(255,255,255,0.2)" },
            }}
          >
            <RestoreIcon sx={{ color: "#00bfff" }} />
          </IconButton>

          <p
            onClick={() => navigate("/history")}
            style={{
              cursor: "pointer",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "1.15rem",
            }}
          >
            History
          </p>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            sx={{
              borderColor: "#ff4d4d",
              color: "#ff4d4d",
              fontWeight: "600",
              "&:hover": { backgroundColor: "rgba(255,77,77,0.1)" },
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* 💫 Main Section */}
      <div
        className="meetContainer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "80px 10%",
          color: "white",
        }}
      >
        {/* Left Side */}
        <div className="leftPanel" style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: "700",
              lineHeight: "1.4",
              marginBottom: "20px",
            }}
          >
            Connect. Collaborate. Create —{" "}
            <span style={{ color: "#00bfff" }}>Only on NovaMeet</span>
          </h1>

          <div style={{ display: "flex", gap: "15px", marginTop: "25px" }}>
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              value={meetingCode}
              label="Enter Meeting Code"
              variant="outlined"
              sx={{
                input: {
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: "500",
                },
                label: { color: "gray", fontSize: "1rem" },
                width: "320px",
              }}
            />

            <Button
              onClick={handleJoinVideoCall}
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #00bfff, #0077ff)",
                fontWeight: "bold",
                fontSize: "1.1rem",
                padding: "10px 25px",
                borderRadius: "10px",
                "&:hover": {
                  background: "linear-gradient(90deg, #00aaff, #0066ff)",
                },
              }}
            >
              Join
            </Button>
          </div>
        </div>

        {/* Right Side */}
        <div
          className="rightPanel"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="/logo3.png"
            alt="NovaMeet Illustration"
            style={{
              width: "90%",
              maxWidth: "520px",
              filter: "drop-shadow(0 0 25px rgba(0,191,255,0.4))",
            }}
          />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
