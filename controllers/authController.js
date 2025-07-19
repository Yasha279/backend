const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");

// Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, username } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = Math.floor(100000 + Math.random() * 900000); 

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      username,
      emailVerificationCode: otp,
      emailVerificationCodeExpires: Date.now() + 10 * 60 * 1000, 
    });

    await sendEmail(
      email,
      "Your Email Verification Code - Yasha Social",
      `
      <div style="font-family: sans-serif;">
        <h2>Welcome to Yasha Social 👋</h2>
        <p>Hi ${name || username},</p>
        <p>Your 6-digit email verification code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
        <br/>
        <p>Thanks,<br/>Yasha Social Team</p>
      </div>
      `
    );

    res.status(201).json({ message: "OTP sent to your email. Please verify." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Verify Email
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({
    email,
    emailVerificationCode: code,
    emailVerificationCodeExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification code." });
  }

  user.isVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationCodeExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully." });
};


// Login
// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

  const token = generateToken(user._id);
  
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role  
    }
  });
};


// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000); 

  user.resetPasswordCode = otp;
  user.resetPasswordCodeExpires = Date.now() + 10 * 60 * 1000; 
  await user.save();

  await sendEmail(
    email,
    "Reset Your Password - Sagar Social",
    `
    <div style="font-family: sans-serif;">
      <h2>Forgot your password?</h2>
      <p>Use the 6-digit code below to reset your password:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This code is valid for 10 minutes.</p>
      <br/>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
    `
  );

  res.json({ message: "OTP sent to email. Please verify to reset password." });
};


// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordCode: code,
    resetPasswordCodeExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  user.password = hashed;
  user.resetPasswordCode = undefined;
  user.resetPasswordCodeExpires = undefined;

  await user.save();
  res.json({ message: "Password has been reset successfully." });
};
