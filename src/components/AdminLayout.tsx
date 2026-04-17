"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/users",     icon: "👤", label: "Users" },
  { href: "/visitors",  icon: "📊", label: "Visitors" },
  { href: "/activity",  icon: "⚡", label: "Activity" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("furci_admin_token");
    if (!token) { router.replace("/login"); return; }
    const raw = localStorage.getItem("furci_admin_info");
    if (raw) try { setAdminName(JSON.parse(raw).name || ""); } catch {}
  }, [router]);

  const logout = () => {
    localStorage.removeItem("furci_admin_token");
    localStorage.removeItem("furci_admin_info");
    router.replace("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: "var(--surface)",
        borderRight: "1px solid var(--border)", display: "flex",
        flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
            Furci<span style={{ color: "var(--primary)" }}>.ai</span>
            <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", fontWeight: 700,
              background: "rgba(36,152,255,0.15)", color: "var(--primary)",
              padding: "0.15rem 0.45rem", borderRadius: "4px" }}>ADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.55rem 0.75rem", borderRadius: "8px", marginBottom: "2px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--primary)" : "var(--muted)",
                background: active ? "rgba(36,152,255,0.1)" : "transparent",
                textDecoration: "none", fontSize: "0.9rem",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          {adminName && (
            <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adminName}
            </div>
          )}
          <button onClick={logout} style={{
            width: "100%", padding: "0.5rem", borderRadius: "8px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem",
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
