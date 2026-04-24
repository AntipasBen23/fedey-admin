"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type OutreachLog = {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  stoppedAt: string;
  sentAt: string;
};

const STEP_LABELS: Record<string, string> = {
  "/hire":              "Job description",
  "/analysis":          "Analysis",
  "/connect":           "Connect accounts",
  "/strategy":          "Strategy",
  "/calendar/generate": "Content calendar",
};

function stepLabel(step: string) {
  return STEP_LABELS[step] || step || "Unknown";
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function OutreachPage() {
  const [logs, setLogs]       = useState<OutreachLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch("/v1/admin/outreach?limit=200");
      const data = await r.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const triggerScan = async () => {
    setTriggering(true);
    try {
      await adminFetch("/v1/admin/outreach/trigger", { method: "POST" });
      setTriggered(true);
      setTimeout(() => { setTriggered(false); load(); }, 3000);
    } catch {} finally { setTriggering(false); }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--text)" }}>
              Onboarding Outreach
            </h1>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              Users who started onboarding but did not finish — and were sent a follow-up email.
            </p>
          </div>
          <button
            onClick={triggerScan}
            disabled={triggering || triggered}
            style={{
              padding: "0.55rem 1.25rem", borderRadius: "8px", fontWeight: 600,
              fontSize: "0.85rem", cursor: triggering ? "not-allowed" : "pointer",
              background: triggered ? "rgba(34,197,94,0.15)" : "rgba(36,152,255,0.15)",
              border: `1px solid ${triggered ? "rgba(34,197,94,0.3)" : "rgba(36,152,255,0.3)"}`,
              color: triggered ? "#22c55e" : "var(--primary)",
              transition: "all 0.2s",
            }}
          >
            {triggered ? "Scan triggered" : triggering ? "Triggering..." : "Run scan now"}
          </button>
        </div>

        {/* Summary tile */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "1rem 1.5rem", marginBottom: "1.5rem",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{total}</span>
          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>total outreach emails sent</span>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading...</p>
        ) : logs.length === 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "3rem", textAlign: "center",
            color: "var(--muted)", fontSize: "0.9rem",
          }}>
            No outreach emails sent yet. Run a scan or wait for the daily check.
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  {["User", "Email", "Stopped at", "Sent"].map(h => (
                    <th key={h} style={{
                      padding: "0.75rem 1rem", textAlign: "left",
                      fontWeight: 600, color: "var(--muted)", fontSize: "0.8rem",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} style={{
                    borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text)", fontWeight: 500 }}>
                      {log.userName || "Unknown"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                      {log.userEmail}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        background: "rgba(251,191,36,0.1)", color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.2)",
                        borderRadius: "5px", padding: "0.2rem 0.6rem",
                        fontSize: "0.78rem", fontWeight: 600,
                      }}>
                        {stepLabel(log.stoppedAt)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)", fontSize: "0.82rem" }}>
                      {fmt(log.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
