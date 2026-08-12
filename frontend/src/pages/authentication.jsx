import React, { useState, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Authentication() {
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const navigate = useNavigate();

  const {
    userData,
    handleLogin,
    handleRegister,
    loading,
  } = useAuth();

  // ✅ Redirect already logged-in users
  useEffect(() => {
    if (!loading && userData) {
      navigate("/home", { replace: true });
    }
  }, [loading, userData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData(e.target);

    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      // =========================
      // 🔐 LOGIN
      // =========================
      if (isLogin) {
        const res = await handleLogin(email, password);

        console.log("🟢 Login result:", res);

        if (res?.ok) {
          navigate("/home", { replace: true });
        } else {
          setMessage(
            res?.error?.message ||
              res?.error?.error ||
              "Invalid email or password."
          );
          setMessageType("error");
        }
      }

      // =========================
      // 📝 REGISTER
      // =========================
      else {
        const res = await handleRegister(
          name,
          email,
          password
        );

        console.log("🟢 Register result:", res);

        if (res?.ok) {
          // 📧 Don't show old login alert
          setMessage(
            res?.message ||
              "Registration successful. Please check your email and verify your account."
          );

          setMessageType("success");

          // Switch to login after registration
          setTimeout(() => {
            setIsLogin(true);
          }, 2500);
        } else {
          setMessage(
            res?.error?.message ||
              res?.error?.error ||
              "Registration failed. Please try again."
          );

          setMessageType("error");
        }
      }
    } catch (error) {
      console.error("❌ Authentication Error:", error);

      setMessage(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2 className="auth-title">
          {isLogin
            ? "Welcome Back 👋"
            : "Create Your NovaMeet Account"}
        </h2>

        {/* ✅ Success / Error message */}
        {message && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 15px",
              borderRadius: "10px",
              fontSize: "14px",
              lineHeight: "1.5",
              background:
                messageType === "success"
                  ? "rgba(34, 197, 94, 0.12)"
                  : "rgba(239, 68, 68, 0.12)",
              border:
                messageType === "success"
                  ? "1px solid rgba(34, 197, 94, 0.4)"
                  : "1px solid rgba(239, 68, 68, 0.4)",
              color:
                messageType === "success"
                  ? "#4ade80"
                  : "#ff6b6b",
            }}
          >
            {message}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="auth-input"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="auth-input"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            required
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={submitting}
          >
            {submitting
              ? isLogin
                ? "Logging in..."
                : "Registering..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
                style={{
                  color: "#1e90ff",
                  cursor: "pointer",
                }}
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
                style={{
                  color: "#1e90ff",
                  cursor: "pointer",
                }}
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}