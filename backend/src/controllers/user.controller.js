import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/mailer.js";

// ==========================================
// REGISTER
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields (name, email, password) are required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Token valid for 15 minutes
    const verificationTokenExpiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // ==========================================
    // PRODUCTION VERIFICATION LINK
    // ==========================================

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://nova-meet-six.vercel.app";

    const verificationLink =
      `${frontendUrl}/verify-email?token=${verificationToken}`;

    console.log("🔗 Verification link generated");
    console.log("📧 Sending verification email to:", normalizedEmail);

    // ==========================================
    // SEND VERIFICATION EMAIL
    // ==========================================

    const emailSent = await sendVerificationEmail(
      normalizedEmail,
      verificationLink
    );

    // If email failed, delete created user
    if (!emailSent) {
      await User.findByIdAndDelete(newUser._id);

      console.error(
        "❌ Registration cancelled because verification email failed."
      );

      return res.status(500).json({
        message:
          "Registration failed because verification email could not be sent.",
      });
    }

    // Registration successful
    return res.status(201).json({
      message:
        "Registration successful. Please verify your email.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);

    return res.status(500).json({
      message:
        error?.message ||
        "Something went wrong during registration.",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Email verification check
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
      });
    }

    // Password check
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);

    return res.status(500).json({
      message:
        error?.message ||
        "Something went wrong during login.",
    });
  }
};

// ==========================================
// VERIFY EMAIL
// ==========================================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log("=================================");
    console.log("🔍 VERIFY EMAIL REQUEST");
    console.log("🔑 Token received:", token ? "YES" : "NO");
    console.log("🔢 Token length:", token?.length || 0);
    console.log("=================================");

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // Find valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: {
        $gt: new Date(),
      },
    });

    console.log(
      "👤 User found:",
      user ? user.email : "NO USER"
    );

    if (!user) {
      console.log(
        "❌ Invalid or expired verification token"
      );

      return res.status(400).json({
        message:
          "Invalid or expired verification link",
      });
    }

    // Verify user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    console.log(
      "✅ EMAIL VERIFIED:",
      user.email
    );

    return res.status(200).json({
      message:
        "Email verified successfully",
    });
  } catch (error) {
    console.error(
      "❌ Email Verification Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while verifying email",
    });
  }
};