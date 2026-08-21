import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  Mail,
  Send,
} from "lucide-react";

export default function ShareMeeting({
  roomId,
  open,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  const meetingLink = `${window.location.origin}/meet/${roomId}`;

  const shareMessage = `Join my NovaMeet meeting:\n${meetingLink}`;

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to copy meeting link:", error);
      alert("Unable to copy the meeting link.");
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(
      shareMessage
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      meetingLink
    )}&text=${encodeURIComponent(
      "Join my NovaMeet meeting"
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareEmail = () => {
    const subject = "NovaMeet Meeting Invitation";

    const body = `Hello,

You are invited to join my NovaMeet meeting.

Meeting Link:
${meetingLink}

See you in the meeting!`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const nativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: "NovaMeet Meeting",
        text: "Join my NovaMeet meeting",
        url: meetingLink,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.warn("Native share failed:", error);
      }
    }
  };

  if (!open) {
    return null;
  }

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(5px)",
          zIndex: 3000,
        }}
      />

      {/* SHARE MODAL */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(500px, 90vw)",
          background:
            "linear-gradient(145deg, #111827, #0B1120)",
          border: "1px solid rgba(0,191,255,0.5)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow:
            "0 0 40px rgba(0,191,255,0.25)",
          zIndex: 3001,
          color: "#fff",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Share2 size={24} color="#00BFFF" />

            <h2
              style={{
                margin: 0,
                color: "#00BFFF",
                fontSize: "1.4rem",
              }}
            >
              Share NovaMeet
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#fff",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* MEETING ID */}
        <div
          style={{
            color: "#aaa",
            fontSize: "0.85rem",
            marginBottom: "7px",
          }}
        >
          Meeting ID
        </div>

        <div
          style={{
            background: "rgba(0,191,255,0.08)",
            border:
              "1px solid rgba(0,191,255,0.25)",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#00BFFF",
            fontWeight: "700",
            marginBottom: "18px",
            wordBreak: "break-all",
          }}
        >
          {roomId}
        </div>

        {/* MEETING LINK */}
        <div
          style={{
            color: "#aaa",
            fontSize: "0.85rem",
            marginBottom: "7px",
          }}
        >
          Meeting Link
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "stretch",
            marginBottom: "22px",
          }}
        >
          <input
            value={meetingLink}
            readOnly
            style={{
              flex: 1,
              minWidth: 0,
              background: "#0B1120",
              border:
                "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              padding: "11px",
              outline: "none",
              fontSize: "0.85rem",
            }}
          />

          <button
            onClick={copyMeetingLink}
            style={{
              background: copied ? "#22c55e" : "#00BFFF",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0 14px",
              cursor: "pointer",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? (
              <>
                <Check size={17} />
                Copied
              </>
            ) : (
              <>
                <Copy size={17} />
                Copy
              </>
            )}
          </button>
        </div>

        {/* SHARE OPTIONS */}
        <div
          style={{
            color: "#aaa",
            fontSize: "0.85rem",
            marginBottom: "12px",
          }}
        >
          Share via
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <ShareButton
            label="WhatsApp"
            icon="🟢"
            onClick={shareWhatsApp}
          />

          <ShareButton
            label="Telegram"
            icon="✈️"
            onClick={shareTelegram}
          />

          <ShareButton
            label="Email"
            icon={<Mail size={18} />}
            onClick={shareEmail}
          />

          <ShareButton
            label="Copy Link"
            icon={<Copy size={18} />}
            onClick={copyMeetingLink}
          />

          {navigator.share && (
            <ShareButton
              label="More Options"
              icon={<Send size={18} />}
              onClick={nativeShare}
            />
          )}
        </div>

        {/* CLOSE */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "10px",
            background: "transparent",
            border:
              "1px solid rgba(255,255,255,0.2)",
            color: "#aaa",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Close
        </button>
      </div>
    </>
  );
}

function ShareButton({
  label,
  icon,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 10px",
        borderRadius: "9px",
        border:
          "1px solid rgba(0,191,255,0.25)",
        background:
          "rgba(0,191,255,0.07)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      {typeof icon === "string" ? (
        <span>{icon}</span>
      ) : (
        icon
      )}

      {label}
    </button>
  );
}