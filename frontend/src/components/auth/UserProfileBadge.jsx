import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, LogOut, Shield, ChevronDown } from "lucide-react";

export default function UserProfileBadge() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = (user.username || user.email || "U").charAt(0).toUpperCase();

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "3px 8px 3px 4px",
          background: "#161920",
          border: "1px solid #232635",
          borderRadius: "999px",
          cursor: "pointer",
          color: "#e2e4f0",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
        }}>
          {initial}
        </div>
        <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.username}
        </span>
        <ChevronDown size={12} color="#8b8fa8" />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "6px",
          width: "200px",
          background: "#12141c",
          border: "1px solid #232635",
          borderRadius: "10px",
          padding: "8px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.7)",
          zIndex: 200,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #232635", marginBottom: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f6" }}>
              {user.username}
            </div>
            <div style={{ fontSize: "11px", color: "#8b8fa8", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
            <div style={{
              display: "inline-block",
              marginTop: "4px",
              padding: "2px 6px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
              {user.role}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            style={{
              width: "100%",
              padding: "8px 10px",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              color: "#f87171",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textAlign: "left",
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
