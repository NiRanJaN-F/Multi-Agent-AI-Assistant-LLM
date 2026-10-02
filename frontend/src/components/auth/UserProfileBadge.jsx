import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, ChevronDown } from "lucide-react";


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
          padding: "4px 10px 4px 5px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "999px",
          cursor: "pointer",
          color: "#e2e4f0",
          fontSize: "12px",
          fontWeight: 500,
          backdropFilter: "blur(12px)",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        }}
      >
        <div style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #818693 0%, #595e69 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}>
          {initial}
        </div>
        <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.username}
        </span>
        <ChevronDown size={12} color="#787d8d" />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          width: "210px",
          background: "rgba(22, 24, 29, 0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          borderRadius: "14px",
          padding: "10px",
          boxShadow: "0 20px 45px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
          zIndex: 200,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
              {user.username}
            </div>
            <div style={{ fontSize: "11.5px", color: "#787d8d", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
              {user.email}
            </div>
            <div style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 7px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#a4a9b8",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
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
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textAlign: "left",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
