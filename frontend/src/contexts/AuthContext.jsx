import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const navigate = useNavigate();

  // 🧩 Register User
  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  // 🧩 Login User
  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      console.log("🟢 Login Attempt:", username, password);
      console.log("🟢 Response:", request.data);

      if (request.status === httpStatus.OK) {
        // ✅ Save token safely
        localStorage.setItem("token", request.data.token);

        // ✅ Smooth Chrome fix for delayed navigation
        setTimeout(() => {
          // First navigate via router
          navigate("/home", { replace: true });

          // Then force reload so AuthContext re-renders immediately
          window.location.href = "http://localhost:3000/home";
        }, 300);
      }
    } catch (err) {
      console.error("❌ Login Error:", err);
      throw err;
    }
  };

  // 🧩 Fetch user history
  const getHistoryOfUser = async () => {
    try {
      const request = await client.get("/get_all_activity", {
        params: { token: localStorage.getItem("token") },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  // 🧩 Add meeting to user history
  const addToUserHistory = async (meetingCode) => {
    try {
      const request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
