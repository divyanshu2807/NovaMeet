import React, { useEffect, useState } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import Typed from "react-typed";
import ParticleBackground from "../components/ParticleBackground";

export default function LandingPage() {
  const router = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("nova_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ Logout function (NO reload, NO popup)
  const handleLogout = () => {
    localStorage.removeItem("nova_user");
    localStorage.removeItem("token");
    setUser(null);

    // clean redirect to login page
    router("/auth", { replace: true });
  };

  return (
    <div className="landingPageContainer">
      <ParticleBackground />

      {/* 🌐 Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 50px",
          position: "relative",
          zIndex: 10,
          background: "rgba(0, 0, 0, 0.6)",
          boxShadow: "0 2px 15px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="navHeader"
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => router("/")}
        >
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: "900",
              background: "linear-gradient(90deg, #00bfff, #0077ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "1.5px",
              fontFamily: "'Poppins', sans-serif",
              margin: 0,
            }}
          >
            NovaMeet
          </h1>
        </div>

        <div
          className="navlist"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "30px",
            fontSize: "1.1rem",
            fontWeight: "600",
          }}
        >
          {user ? (
            <>
              <p
                style={{
                  color: "#00bcd4",
                  fontWeight: "700",
                  fontSize: "1.05rem",
                }}
              >
                Welcome, {user.name} 👋
              </p>
              <p
                onClick={handleLogout}
                style={{
                  cursor: "pointer",
                  color: "#ff4d4d",
                  fontWeight: "700",
                  fontSize: "1.05rem",
                  transition: "0.3s",
                }}
              >
                Logout
              </p>
            </>
          ) : (
            <>
              <p
                onClick={() => router("/guest")}
                style={{
                  cursor: "pointer",
                  color: "#ffffff",
                  transition: "0.3s",
                }}
              >
                Join as Guest
              </p>
              <p
                onClick={() => router("/auth")}
                style={{
                  cursor: "pointer",
                  color: "#ffffff",
                  transition: "0.3s",
                }}
              >
                Register
              </p>
              <div
                onClick={() => router("/auth")}
                role="button"
                style={{
                  background: "linear-gradient(90deg, #00bfff, #0077ff)",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 0 10px rgba(0,191,255,0.4)",
                }}
              >
                Login
              </div>
            </>
          )}
        </div>
      </nav>

      {/* 💫 Hero Section */}
      <div
        className="landingMainContainer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "90px 10%",
          color: "white",
        }}
      >
        <div className="hero-left" style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: "800",
              marginBottom: "20px",
              color: "#ffffff",
            }}
          >
            <Typed
              strings={[
                "Where Minds Meet.",
                "Where Teams Sync.",
                "Where Ideas Flow.",
              ]}
              typeSpeed={60}
              backSpeed={30}
              loop
            />
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              fontWeight: "500",
              lineHeight: "1.7",
              maxWidth: "600px",
            }}
          >
            Experience a new era of connection with{" "}
            <span
              style={{
                color: "#00bfff",
                fontWeight: "700",
              }}
            >
              NovaMeet
            </span>{" "}
            — your intelligent video conferencing platform.
          </p>

          <div
            className="cta-buttons"
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <Link
              to="/auth"
              className="primary-btn"
              style={{
                background: "linear-gradient(90deg, #00bfff, #0077ff)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 0 15px rgba(0,191,255,0.3)",
              }}
            >
              Start a Sync
            </Link>
            <Link
              to="/guest"
              className="outline-btn"
              style={{
                border: "2px solid #00bfff",
                color: "#00bfff",
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Join a Space
            </Link>
          </div>
        </div>

        <div
          className="hero-right"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="/mobile.png"
            alt="NovaMeet Preview"
            style={{
              width: "90%",
              maxWidth: "520px",
              filter: "drop-shadow(0 0 25px rgba(0,191,255,0.4))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
