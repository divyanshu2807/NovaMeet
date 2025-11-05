// src/pages/authentication.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Authentication() {
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { userData, handleLogin, handleRegister, loading } = useAuth();

  useEffect(() => {
    if (!loading && userData) {
      // if userData exists, redirect to home
      navigate("/home", { replace: true });
    }
  }, [loading, userData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent double submit
    setSubmitting(true);

    console.log("🟢 Form submitted");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      if (isLogin) {
        const res = await handleLogin(email, password);
        console.log("🟢 handleLogin result:", res);

        if (res?.ok) {
          // Navigate only if we have a token (or fallback token provided by AuthContext)
          if (res.token) {
            navigate("/home", { replace: true });
          } else {
            // fallback: still navigate but warn in console
            console.warn("No token returned from login response; navigating with fallback.");
            navigate("/home", { replace: true });
          }
        } else {
          alert("Login failed: " + (res?.error?.message || "Check credentials"));
        }
      } else {
        const res = await handleRegister(name, email, password);
        if (res.ok) {
          alert("Registration successful, please login.");
          setIsLogin(true);
        } else {
          alert("Register failed: " + (res?.error?.message || "Try again"));
        }
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="auth-page">
        <div className="auth-card">Checking session...</div>
      </div>
    );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? "Welcome Back 👋" : "Create Your NovaMeet Account"}
        </h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" name="name" placeholder="Full Name" className="auth-input" required />
          )}
          <input type="email" name="email" placeholder="Email Address" className="auth-input" required />
          <input type="password" name="password" placeholder="Password" className="auth-input" required />

          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? (isLogin ? "Logging in..." : "Registering...") : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? (
            <>
              Don’t have an account?{" "}
              <span onClick={() => setIsLogin(false)} style={{ color: "#1e90ff", cursor: "pointer" }}>
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span onClick={() => setIsLogin(true)} style={{ color: "#1e90ff", cursor: "pointer" }}>
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
