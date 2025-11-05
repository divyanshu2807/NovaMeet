// ✅ src/utils/withAuth.js
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function withAuth(Component) {
  return function ProtectedComponent(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { loading } = useAuth();

    useEffect(() => {
      if (!loading) {
        const storedToken = localStorage.getItem("token");

        // Redirect logic: only navigate if path is different
        if ((!storedToken || storedToken === "null") && location.pathname !== "/auth") {
          console.log("🔴 No token found → redirecting to /auth");
          navigate("/auth", { replace: true });
        }

        if (storedToken && location.pathname === "/auth") {
          console.log("🟢 Token found → redirecting to /home");
          navigate("/home", { replace: true });
        }
      }
    }, [loading, location.pathname, navigate]);

    if (loading) {
      return (
        <div
          style={{
            color: "white",
            textAlign: "center",
            marginTop: "20vh",
            fontSize: "1.5rem",
          }}
        >
          Checking session...
        </div>
      );
    }

    return <Component {...props} />;
  };
}
