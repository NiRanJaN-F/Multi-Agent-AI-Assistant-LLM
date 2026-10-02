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
          color: #e2e4f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
          overflow-x: hidden;
        }

        .login-card {
          width: 100%;
          max-width: 860px;
          min-height: 530px;
          background: #16181d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 26px;
          padding: 28px 28px 28px 36px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.03);
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .login-dots {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 24px;
        }

        .login-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3c404b;
          transition: background 0.2s ease;
        }

        .login-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          flex: 1;
          align-items: center;
        }

        .login-form-pane {
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 360px;
          width: 100%;
          margin: 0 auto;
        }

        .login-title {
          font-size: 26px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 13px;
          color: #727786;
          margin: 0 0 24px 0;
          font-weight: 400;
        }

        .login-input {
          width: 100%;
          padding: 13px 18px;
          background: #21242b;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          color: #ffffff;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
          margin-bottom: 14px;
        }

        .login-input::placeholder {
          color: #5b6070;
        }

        .login-input:focus {
          border-color: rgba(255, 255, 255, 0.22);
          background: #242730;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.03);
        }

        .login-btn-primary {
          width: 100%;
          padding: 12px 18px;
          background: linear-gradient(180deg, #818693 0%, #595e69 100%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: all 0.15s ease;
          margin-top: 4px;
        }

        .login-btn-primary:hover:not(:disabled) {
          opacity: 0.94;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .login-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-mode-toggle {
          margin-top: 14px;
          text-align: center;
          font-size: 12.5px;
          color: #727786;
        }

        .login-mode-toggle button {
          background: none;
          border: none;
          color: #9ea3b2;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-left: 5px;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s ease;
        }

        .login-mode-toggle button:hover {
          color: #ffffff;
        }

        .login-demo-btn {
          width: 100%;
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 11px;
          color: #9499aa;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .login-demo-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .login-visual-pane {
          width: 100%;
          height: 100%;
          min-height: 440px;
          max-height: 480px;
          background: #0d0f13;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .login-visual-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .login-error-box {
          padding: 9px 13px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 12px;
          margin-bottom: 14px;
        }

        .login-footer-badges {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 11px;
          color: #535766;
        }

        @media (max-width: 768px) {
          .login-card {
            padding: 24px 20px;
          }
          .login-layout {
            grid-template-columns: 1fr;
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
