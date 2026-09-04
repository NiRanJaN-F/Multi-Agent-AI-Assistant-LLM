import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, User, ArrowRight, Zap, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError(null);
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, #181926 0%, #0d0f14 60%, #090a0f 100%)",
      color: "#e2e4f0",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: "20px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "500px",
        height: "300px",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Main Auth Card */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#12141c",
        border: "1px solid #232635",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* App Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: "12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            color: "#fff",
            marginBottom: "14px",
            boxShadow: "0 8px 20px -4px rgba(99, 102, 241, 0.5)",
          }}>
            ⬡
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f4f4f6", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Multi-Agent AI Assistant
          </h1>
          <p style={{ fontSize: "13px", color: "#8b8fa8", margin: 0 }}>
            Sign in to access your autonomous software engineering workspace
          </p>
        </div>

        {/* 1-Click Demo Login Banner (Perfect for Demo Day) */}
        <div style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "10px",
              color: "#a5b4fc",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
          >
            <Zap size={16} color="#818cf8" />
            {demoLoading ? "Accessing Demo..." : "Continue with Demo Account (Instant Access)"}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#232635" }} />
          <span style={{ fontSize: "11px", color: "#5a5e73", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            or use credentials
          </span>
          <div style={{ flex: 1, height: "1px", background: "#232635" }} />
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: "flex",
          background: "#181a24",
          padding: "3px",
          borderRadius: "8px",
          border: "1px solid #232635",
          marginBottom: "20px",
        }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: "6px",
              background: mode === "login" ? "#6366f1" : "transparent",
              color: mode === "login" ? "#fff" : "#8b8fa8",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); }}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: "6px",
              background: mode === "register" ? "#6366f1" : "transparent",
              color: mode === "register" ? "#fff" : "#8b8fa8",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "12px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8b8fa8", marginBottom: "6px" }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} color="#5a5e73" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  required
                  placeholder="Niranjan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    background: "#181a24",
                    border: "1px solid #232635",
                    borderRadius: "8px",
                    color: "#f4f4f6",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8b8fa8", marginBottom: "6px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} color="#5a5e73" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                required
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "#181a24",
                  border: "1px solid #232635",
                  borderRadius: "8px",
                  color: "#f4f4f6",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8b8fa8", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} color="#5a5e73" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "#181a24",
                  border: "1px solid #232635",
                  borderRadius: "8px",
                  color: "#f4f4f6",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            style={{
              marginTop: "8px",
              padding: "11px",
              background: "#6366f1",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background 0.15s ease",
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security & Feature Badges Footer */}
        <div style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid #232635",
          display: "flex",
          justifyContent: "space-around",
          fontSize: "11px",
          color: "#5a5e73",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={13} color="#10b981" /> JWT Secure
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={13} color="#6366f1" /> 7 AI Specialists
          </span>
        </div>
      </div>
    </div>
  );
}
