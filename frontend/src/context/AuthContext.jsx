import React, { createContext, useContext, useEffect, useState } from "react";
import { demoLoginUser, getCurrentUser, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "maa_auth_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const u = await getCurrentUser(stored);
        setUser(u);
        setToken(stored);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  async function login(email, password) {
    const res = await loginUser({ email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function register(username, email, password) {
    const res = await registerUser({ username, email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function demoLogin() {
    const res = await demoLoginUser();
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    demoLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
