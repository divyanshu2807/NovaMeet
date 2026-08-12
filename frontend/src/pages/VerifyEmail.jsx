import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import server from "../environment";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  // 🛡️ Prevent duplicate verification request
  const verificationStarted = useRef(false);

  useEffect(() => {
    // React StrictMode/dev mode can run effects twice
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await fetch(
          `${server}/api/v1/users/verify-email?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(
            data.message || "Email verified successfully!"
          );
        } else {
          setStatus("error");
          setMessage(
            data.message || "Invalid or expired verification link."
          );
        }
      } catch (error) {
        console.error("Email verification error:", error);

        setStatus("error");
        setMessage(
          "Unable to verify your email. Please try again later."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#080b14",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "40px",
          borderRadius: "20px",
          background: "#111522",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(30, 144, 255, 0.15)",
        }}
      >
        {status === "verifying" && (
          <>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>
              📧
            </div>

            <h2 style={{ color: "white", marginBottom: "15px" }}>
              Verifying Email
            </h2>

            <p style={{ color: "#aaa" }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "55px", marginBottom: "20px" }}>
              ✅
            </div>

            <h2 style={{ color: "#32cd32", marginBottom: "15px" }}>
              Email Verified!
            </h2>

            <p style={{ color: "#ccc", marginBottom: "25px" }}>
              {message}
            </p>

            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                background: "#1e90ff",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "55px", marginBottom: "20px" }}>
              ❌
            </div>

            <h2 style={{ color: "#ff4d4d", marginBottom: "15px" }}>
              Verification Failed
            </h2>

            <p style={{ color: "#ccc", marginBottom: "25px" }}>
              {message}
            </p>

            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                background: "#1e90ff",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;