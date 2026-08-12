import "./App.css";
import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <div className="App">
      {/* App must NOT create another Router — Routes only */}
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/auth" element={<Authentication />} />

        <Route path="/home" element={<HomeComponent />} />

        <Route path="/history" element={<History />} />

        <Route path="/meet/:roomId" element={<VideoMeetComponent />} />

        {/* 📧 Email verification */}
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </div>
  );
}

export default App;