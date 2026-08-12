import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, verificationLink) => {
  try {
    await transporter.sendMail({
      from: `"NovaMeet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your NovaMeet account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to NovaMeet 🎥</h2>

          <p>Thanks for creating your NovaMeet account.</p>

          <p>Please click the button below to verify your email address:</p>

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
            This verification link will expire in 15 minutes.
          </p>

          <p>If you didn't create this account, you can safely ignore this email.</p>

          <p>— NovaMeet Team</p>
        </div>
      `,
    });

    console.log(`📧 Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return false;
  }
};