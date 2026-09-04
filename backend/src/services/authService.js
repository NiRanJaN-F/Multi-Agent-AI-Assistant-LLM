import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "multi-agent-assistant-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function registerUser({ username, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "developer",
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

export async function createDemoSession() {
  const demoEmail = "evaluator.demo@multi-agent.ai";
  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("demo12345", salt);
    user = await User.create({
      username: "Demo Evaluator",
      email: demoEmail,
      passwordHash,
      role: "evaluator",
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

export async function getUserById(id) {
  const user = await User.findById(id).select("-passwordHash");
  if (!user) return null;
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
