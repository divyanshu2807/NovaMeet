import "dotenv/config";
import nodemailer from "nodemailer";

// ==========================================
// GMAIL TRANSPORTER
// ==========================================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// SEND VERIFICATION EMAIL
// ==========================================
export const sendVerificationEmail = async (
  email,
  verificationLink
) => {
  try {
    console.log("=================================");
    console.log("📧 EMAIL CONFIG CHECK");
    console.log(
      "EMAIL_USER:",
      process.env.EMAIL_USER ? "SET" : "MISSING"
    );
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS ? "SET" : "MISSING"
    );
    console.log("📨 Sending email to:", email);
    console.log("🔗 Verification link:", verificationLink);
    console.log("=================================");

    await transporter.sendMail({
      from: `"NovaMeet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your NovaMeet account",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          "
        >
          <h2 style="color: #1e90ff;">
            Welcome to NovaMeet 🎥
          </h2>

          <p>
            Thanks for creating your NovaMeet account.
          </p>

          <p>
            Please click the button below to verify
            your email address:
          </p>

          <a
            href="${verificationLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background: #1e90ff;
              color: white;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Verify Email
          </a>

          <p style="margin-top: 20px;">
            This verification link will expire in
            15 minutes.
          </p>

          <p>
            If you didn't create this account,
            you can safely ignore this email.
          </p>

          <p>
            — NovaMeet Team
          </p>
        </div>
      `,
    });

    console.log(
      `📧 Verification email sent successfully to: ${email}`
    );

    return true;
  } catch (error) {
    console.error("❌ EMAIL SENDING FAILED");

    console.error("Error name:", error?.name);
    console.error("Error code:", error?.code);
    console.error("Error command:", error?.command);
    console.error("Error response:", error?.response);
    console.error("Error responseCode:", error?.responseCode);
    console.error("Error message:", error?.message);
    console.error("Full error:", error);

    return false;
  }
};