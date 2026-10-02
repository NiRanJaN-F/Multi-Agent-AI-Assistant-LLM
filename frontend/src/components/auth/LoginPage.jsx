import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import loginIllustration from "../../assets/login-illustration.png";

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
    <div className="login-root">
      <style>{`
        .login-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #08090b;
          background-image: 
            radial-gradient(circle at 50% 20%, rgba(40, 44, 56, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(25, 28, 38, 0.2) 0%, transparent 50%);
          color: #e2e4f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 32px 24px;
          box-sizing: border-box;
          position: relative;
          overflow-x: hidden;
        }

        .login-card {
          width: 100%;
          max-width: 1060px;
          min-height: 620px;
          background: rgba(22, 24, 29, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 36px 36px 36px 44px;
          box-shadow: 
            0 35px 90px rgba(0, 0, 0, 0.85),
            0 0 1px 1px rgba(255, 255, 255, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .login-dots {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
        }

        .login-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #3c404b;
          transition: background 0.2s ease;
        }

        .login-layout {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 48px;
          flex: 1;
          align-items: center;
        }

        .login-form-pane {
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
          letter-spacing: -0.025em;
        }

        .login-subtitle {
          font-size: 14.5px;
          color: #787d8d;
          margin: 0 0 28px 0;
          font-weight: 400;
          line-height: 1.4;
        }

        .login-input {
          width: 100%;
          padding: 15px 20px;
          background: #21242b;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          color: #ffffff;
          font-size: 14.5px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
          margin-bottom: 16px;
        }

        .login-input::placeholder {
          color: #5b6070;
        }

        .login-input:focus {
          border-color: rgba(255, 255, 255, 0.25);
          background: #252832;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.04);
        }

        .login-btn-primary {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(180deg, #818693 0%, #595e69 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.28);
          transition: all 0.15s ease;
          margin-top: 6px;
        }

        .login-btn-primary:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        .login-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-mode-toggle {
          margin-top: 18px;
          text-align: center;
          font-size: 13.5px;
          color: #727786;
        }

        .login-mode-toggle button {
          background: none;
          border: none;
          color: #a4a9b8;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-left: 6px;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s ease;
        }

        .login-mode-toggle button:hover {
          color: #ffffff;
        }

        .login-demo-btn {
          width: 100%;
          margin-top: 14px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 13px;
          color: #9da2b4;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.15s ease;
        }

        .login-demo-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .login-visual-pane {
          width: 100%;
          height: 100%;
          min-height: 520px;
          max-height: 560px;
          background: #0d0f13;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .login-visual-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .login-error-box {
          padding: 10px 15px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .login-footer-badges {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          font-size: 12px;
          color: #5d6172;
        }

        @media (max-width: 900px) {
          .login-card {
            max-width: 100%;
            padding: 28px 24px;
          }
          .login-layout {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .login-visual-pane {
            display: none;
          }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="login-card">
        {/* Top-left window control dots */}
        <div className="login-dots">
          <div className="login-dot" />
          <div className="login-dot" />
          <div className="login-dot" />
        </div>

        {/* 2-Column Layout */}
        <div className="login-layout">
          {/* Left Column: Form */}
          <div className="login-form-pane">
            <h1 className="login-title">
              {mode === "login" ? "Welcome Back!" : "Get Started"}
            </h1>
            <p className="login-subtitle">
              {mode === "login"
                ? "Enter your info to Sign In"
                : "Enter your info to create an account"}
            </p>

            {error && (
              <div className="login-error-box">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  autoComplete="username"
                />
              )}

              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                autoComplete="email"
              />

              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />

              <button
                type="submit"
                disabled={loading || demoLoading}
                className="login-btn-primary"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            {/* 1-Click Demo Login button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="login-demo-btn"
            >
              <Zap size={13} color="#a5b4fc" />
              {demoLoading ? "Accessing Demo Account..." : "Instant Demo Access"}
            </button>

            {/* Mode Switcher */}
            <div className="login-mode-toggle">
              {mode === "login" ? (
                <>
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {/* Subtle security/status badges */}
            <div className="login-footer-badges">
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={12} color="#10b981" /> JWT Secure
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={12} color="#818cf8" /> Multi-Agent AI
              </span>
            </div>
          </div>

          {/* Right Column: Visual Artwork */}
          <div className="login-visual-pane">
            <img
              src={loginIllustration}
              alt="Multi Agent AI Visual"
              className="login-visual-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
