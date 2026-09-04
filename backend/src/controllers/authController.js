import {
  createDemoSession,
  getUserById,
  loginUser,
  registerUser,
} from "../services/authService.js";

export async function postRegister(req, res, next) {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !String(username).trim()) {
      return res.status(400).json({ status: "error", message: "Username is required." });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ status: "error", message: "Email is required." });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters." });
    }

    const result = await registerUser({ username, email, password });
    res.status(201).json({ status: "ok", ...result });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
}

export async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required." });
    }

    const result = await loginUser({ email, password });
    res.json({ status: "ok", ...result });
  } catch (error) {
    res.status(401).json({ status: "error", message: error.message });
  }
}

export async function postDemoLogin(_req, res, next) {
  try {
    const result = await createDemoSession();
    res.json({ status: "ok", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Not authenticated." });
    }
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }
    res.json({ status: "ok", user });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}
