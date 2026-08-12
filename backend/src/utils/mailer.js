import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// SEND VERIFICATION EMAIL
// ==========================================
export const sendVerificationEmail = async (
  email,
  verificationLink
) => {
  try {
    console.log("=================================");
    console.log("📧 RESEND EMAIL CONFIG CHECK");
    console.log(
      "RESEND_API_KEY:",
      process.env.RESEND_API_KEY ? "SET" : "MISSING"
    );
    console.log("📨 Sending email to:", email);
    console.log("🔗 Verification link:", verificationLink);
    console.log("=================================");

    const { data, error } = await resend.emails.send({
      from: "NovaMeet <onboarding@resend.dev>",
      to: [email],
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
            This verification link will expire in 15 minutes.
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

    if (error) {
      console.error("❌ RESEND EMAIL FAILED");
      console.error("Error:", error);

      return false;
    }

    console.log(
      `📧 Verification email sent successfully to: ${email}`
    );
    console.log("📨 Resend ID:", data?.id);

    return true;
  } catch (error) {
    console.error("❌ RESEND EMAIL EXCEPTION");
    console.error("Error:", error);

    return false;
  }
};