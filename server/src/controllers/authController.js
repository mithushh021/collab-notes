import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ── Register ──────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Please provide name, email and password" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12); // ✅ rounds 10→12

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" }); // ✅ no leak
  }
  // ❌ REMOVED: console.log after res.status(201) — unreachable code, leaks headers in prod
};

// ── Login ─────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please provide email and password" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // ✅ Single condition prevents user-enumeration attack
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ── Get Me ────────────────────────────────────────────────
export const getMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" }); // ✅ null guard

  const { _id, name, email, createdAt, updatedAt } = req.user;
  res.json({ _id, name, email, createdAt, updatedAt });
};