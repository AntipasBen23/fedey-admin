"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, adminKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("furci_admin_token", data.token);
      localStorage.setItem("furci_admin_info", JSON.stringify(data.admin));
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.7rem 0.9rem", borderRadius: "10px",
    border: "1.5px solid var(--border)", background: "var(--surface-2)",
    color: "var(--text)", fontSize: "0.9rem", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontWeight: 900, fontSize: "1.5rem" }}>
            Furci<span style={{ color: "var(--primary)" }}>.ai</span>
          </div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.8rem",
            background: "rgba(36,152,255,0.12)", color: "var(--primary)",
            display: "inline-block", padding: "0.2rem 0.7rem", borderRadius: "20px", fontWeight: 700 }}>
            ADMIN PANEL
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "var(--surface)",
          borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: "1rem" }}>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600,
              color: "var(--muted)", marginBottom: "0.4rem" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com" required style={inp} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600,
              color: "var(--muted)", marginBottom: "0.4rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                required style={{ ...inp, paddingRight: "3rem" }} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem" }}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600,
              color: "var(--muted)", marginBottom: "0.4rem" }}>Admin Key</label>
            <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
              placeholder="Secret admin key" required style={inp} />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: "0.8rem", borderRadius: "10px", border: "none", marginTop: "0.25rem",
            background: loading ? "var(--border)" : "var(--primary)",
            color: loading ? "var(--muted)" : "#fff",
            fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Signing in…" : "Sign In to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
