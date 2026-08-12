import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/mailer.js";

// ✅ Register Controller
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields (name, email, password) are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔑 Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // ⏰ Token valid for 15 minutes
    const verificationTokenExpiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // 👤 Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // 🔗 Verification link
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    // 📧 Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      verificationLink
    );

    // ❌ If email could not be sent, remove user
    if (!emailSent) {
      await User.findByIdAndDelete(newUser._id);

      return res.status(500).json({
        message:
          "Registration failed because verification email could not be sent.",
      });
    }

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
    console.error("Registration Error:", error);

    return res.status(500).json({
      message: `Something went wrong: ${error.message}`,
    });
  }
};

// ✅ Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 📧 Check email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
      });
    }

    // 🔐 Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 🔑 Generate JWT token
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
    console.error("Login Error:", error);

    return res.status(500).json({
      message: `Something went wrong: ${error.message}`,
    });
  }
};

// ✅ Verify Email Controller
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log("🔍 VERIFY EMAIL REQUEST");
    console.log("🔑 Token received:", token);
    console.log("🔢 Token length:", token?.length);

    if (!token) {
      console.log("❌ No verification token received");

      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // 🔍 Find user with valid token and unexpired token
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

    console.log(
      "⏰ Current time:",
      new Date().toISOString()
    );

    if (!user) {
      console.log(
        "❌ Invalid or expired verification token"
      );

      return res.status(400).json({
        message: "Invalid or expired verification link",
      });
    }

    // ✅ Verify email
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    console.log("✅ EMAIL VERIFIED:", user.email);

    return res.status(200).json({
      message: "Email verified successfully",
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