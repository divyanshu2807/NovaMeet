const server =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://novameet-backend.onrender.com";

export default server;