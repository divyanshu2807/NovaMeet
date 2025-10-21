import React, { useState, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function Authentication() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // 🧩 Auto-redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("nova_user");
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      const response = await fetch(
        isLogin
          ? "http://localhost:8000/api/v1/users/login"
          : "http://localhost:8000/api/v1/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin ? { email, password } : { name, email, password }
          ),
        }
      );

      const data = await response.json();
      console.log("✅ Response:", data);

      if (response.ok) {
        // ✅ Save user & token
        localStorage.setItem("nova_user", JSON.stringify(data.user));
        if (data.token) localStorage.setItem("token", data.token);

        // ✅ Navigate to Home cleanly
        navigate("/home", { replace: true });

        // Small safety reload for instant re-render
       // setTimeout(() => window.location.reload(), 200);
      } else {
        console.warn("⚠️ Login/Register failed:", data.message);
      }
    } catch (error) {
      console.error("❌ Server error:", error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? "Welcome Back 👋" : "Create Your NovaMeet Account"}
        </h2>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? (
            <>
              Don’t have an account?{" "}
              <span onClick={() => setIsLogin(false)}>Register</span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span onClick={() => setIsLogin(true)}>Login</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
