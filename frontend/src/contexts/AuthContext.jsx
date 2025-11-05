// ✅ src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import httpStatus from "http-status";
import server from "../environment";

export const AuthContext = createContext(null);

// axios client for auth/user endpoints
const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

// attach token to every request automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // initial load from localStorage
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  // sync user to localStorage
  useEffect(() => {
    try {
      if (userData) localStorage.setItem("user", JSON.stringify(userData));
      else localStorage.removeItem("user");
    } catch (e) {
      console.error("Error syncing user to localStorage", e);
    }
  }, [userData]);

  // sync token to localStorage
  useEffect(() => {
    try {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    } catch (e) {
      console.error("Error syncing token to localStorage", e);
    }
  }, [token]);

  // ✅ Register
  const handleRegister = async (name, email, password) => {
    try {
      const request = await client.post("/register", { name, email, password });
      if (request.status === httpStatus.CREATED) {
        return { ok: true, message: request.data.message };
      }
      return { ok: false, message: request.data };
    } catch (err) {
      console.error("Register error:", err);
      return { ok: false, error: err?.response?.data || err.message || err };
    }
  };

  // ✅ Login (fixed: uses email instead of username)
  const handleLogin = async (email, password) => {
    try {
      const request = await client.post("/login", { email, password });
      console.log("🟢 Login Attempt:", email);
      console.log("LOGIN RESPONSE:", request.data);

      const data = request.data || {};
      const receivedToken =
        data.token ||
        data?.data?.token ||
        request.headers?.["x-auth-token"] ||
        data.accessToken ||
        null;

      const receivedUser = data.user || data?.data?.user || data?.data || null;

      const finalToken =
        receivedToken ||
        (receivedUser && (receivedUser._id || receivedUser.id)
          ? `local:${receivedUser._id || receivedUser.id}`
          : null);

      if (finalToken) setToken(finalToken);
      if (receivedUser) setUserData(receivedUser);

      // navigate to home page on success
      navigate("/home", { replace: true });

      return { ok: true, data: request.data, token: finalToken };
    } catch (err) {
      console.error("❌ Login Error:", err?.response?.data || err.message || err);
      return { ok: false, error: err?.response?.data || err.message || err };
    }
  };

  // ✅ Logout
  const logout = () => {
    setToken(null);
    setUserData(null);
    navigate("/auth", { replace: true });
  };

  // ✅ Fetch user history
  const getHistoryOfUser = async () => {
    try {
      const request = await client.get("/get_all_activity");
      return { ok: true, data: request.data };
    } catch (err) {
      console.error("getHistory error:", err);
      return { ok: false, error: err?.response?.data || err.message || err };
    }
  };

  // ✅ Add meeting to history
  const addToUserHistory = async (meetingCode) => {
    try {
      const request = await client.post("/add_to_activity", {
        meeting_code: meetingCode,
      });
      return { ok: true, data: request.data };
    } catch (err) {
      console.error("addToUserHistory error:", err);
      return { ok: false, error: err?.response?.data || err.message || err };
    }
  };

  const data = {
    userData,
    setUserData,
    token,
    setToken,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
    logout,
    loading,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

// ✅ Custom hook
export const useAuth = () => useContext(AuthContext);
