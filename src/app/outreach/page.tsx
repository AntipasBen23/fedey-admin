"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type IncompleteUser = {
  id: number; name: string; email: string; stoppedAt: string; createdAt: string;
};
type CompletedUser = {
  id: number; name: string; email: string; completedAt: string; receivedOutreach: boolean;
};
type OutreachLog = {
  id: number; userId: number; userEmail: string; userName: string; stoppedAt: string; sentAt: string;
};

const STEP_LABELS: Record<string, string> = {
  "/hire":              "Job description",
  "/analysis":          "Analysis",
  "/connect":           "Connect accounts",
  "/strategy":          "Strategy",
  "/calendar/generate": "Content calendar",
};

function stepLabel(s: string) { return STEP_LABELS[s] || s || "Unknown"; }
function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const cell: React.CSSProperties = { padding: "0.75rem 1rem" };
const th: React.CSSProperties   = { ...cell, textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "0.8rem" };

function SectionTitle({ label, count, loading }: { label: string; count: number; loading: boolean }) {
  return (
    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.75rem" }}>
      {label}
      {!loading && (
        <span style={{ marginLeft: "0.6rem", fontSize: "0.8rem", fontWeight: 500, color: "var(--muted)" }}>
          ({count})
        </span>
      )}
    </h2>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px",
      padding: "2.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem",
      marginBottom: "2.5rem",
    }}>{text}</div>
  );
}

export default function OutreachPage() {
  const [incomplete, setIncomplete]   = useState<IncompleteUser[]>([]);
  const [completed, setCompleted]     = useState<CompletedUser[]>([]);
  const [logs, setLogs]               = useState<OutreachLog[]>([]);
  const [logTotal, setLogTotal]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [triggering, setTriggering]   = useState(false);
  const [triggered, setTriggered]     = useState(false);
  const [rowState, setRowState]       = useState<Record<number, "sending" | "sent" | "error">>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, compRes, logRes] = await Promise.all([
        adminFetch("/v1/admin/outreach/incomplete"),
        adminFetch("/v1/admin/outreach/completed"),
        adminFetch("/v1/admin/outreach?limit=200"),
      ]);
      const [incData, compData, logData] = await Promise.all([incRes.json(), compRes.json(), logRes.json()]);
      setIncomplete(incData.users || []);
      setCompleted(compData.users || []);
      setLogs(logData.logs || []);
      setLogTotal(logData.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendToUser = async (userId: number) => {
    setRowState(prev => ({ ...prev, [userId]: "sending" }));
    try {
      const res = await adminFetch(`/v1/admin/outreach/trigger/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setRowState(prev => ({ ...prev, [userId]: "sent" }));
      setTimeout(() => load(), 2000);
    } catch {
      setRowState(prev => ({ ...prev, [userId]: "error" }));
      setTimeout(() => setRowState(prev => { const n = { ...prev }; delete n[userId]; return n; }), 3000);
    }
  };

  const triggerScan = async () => {
    setTriggering(true);
    try {
      await adminFetch("/v1/admin/outreach/trigger", { method: "POST" });
      setTriggered(true);
      setTimeout(() => { setTriggered(false); load(); }, 4000);
    } catch {} finally { setTriggering(false); }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1020 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--text)" }}>
              Onboarding Outreach
            </h1>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              Track users who stopped halfway, who completed, and who was emailed.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={() => load()}
              disabled={loading}
              style={{
                padding: "0.6rem 1rem", borderRadius: "8px", fontWeight: 600,
                fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                color: "var(--muted)", transition: "all 0.2s",
              }}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              onClick={triggerScan}
              disabled={triggering || triggered}
              style={{
                padding: "0.6rem 1.4rem", borderRadius: "8px", fontWeight: 700,
                fontSize: "0.875rem", cursor: triggering ? "not-allowed" : "pointer",
                background: triggered ? "rgba(34,197,94,0.15)" : "rgba(36,152,255,0.2)",
                border: `1px solid ${triggered ? "rgba(34,197,94,0.4)" : "rgba(36,152,255,0.4)"}`,
                color: triggered ? "#22c55e" : "var(--primary)", transition: "all 0.2s",
              }}
            >
              {triggered ? "Emails are being sent..." : triggering ? "Triggering..." : "Send emails to all below"}
            </button>
          </div>
        </div>

        {/* ── Section 1: Stopped halfway ── */}
        <SectionTitle label="Stopped halfway" count={incomplete.length} loading={loading} />
        {loading ? <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>Loading...</p>
        : incomplete.length === 0 ? (
          <EmptyBox text="No incomplete users. Everyone has either finished or not started yet." />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "2.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Stopped at</th><th style={th}>Signed up</th><th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: i < incomplete.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...cell, color: "var(--text)", fontWeight: 500 }}>{u.name || "Unknown"}</td>
                    <td style={{ ...cell, color: "var(--muted)" }}>{u.email}</td>
                    <td style={cell}>
                      <span style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "5px", padding: "0.2rem 0.6rem", fontSize: "0.78rem", fontWeight: 600 }}>
                        {stepLabel(u.stoppedAt)}
                      </span>
                    </td>
                    <td style={{ ...cell, color: "var(--muted)", fontSize: "0.82rem" }}>{u.createdAt}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {(() => {
                        const state = rowState[u.id];
                        if (state === "sent") return <span style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 600 }}>Sent</span>;
                        if (state === "error") return <span style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 600 }}>Failed</span>;
                        return (
                          <button
                            disabled={state === "sending"}
                            onClick={() => sendToUser(u.id)}
                            style={{
                              padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem",
                              fontWeight: 600, cursor: state === "sending" ? "not-allowed" : "pointer",
                              background: "rgba(36,152,255,0.12)", border: "1px solid rgba(36,152,255,0.3)",
                              color: "var(--primary)", transition: "all 0.2s",
                            }}
                          >
                            {state === "sending" ? "Sending..." : "Send email"}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Section 2: Completed onboarding ── */}
        <SectionTitle label="Completed onboarding" count={completed.length} loading={loading} />
        {!loading && completed.length === 0 ? (
          <EmptyBox text="No users have completed onboarding yet." />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "2.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Completed</th><th style={th}>Via outreach</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: i < completed.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...cell, color: "var(--text)", fontWeight: 500 }}>{u.name || "Unknown"}</td>
                    <td style={{ ...cell, color: "var(--muted)" }}>{u.email}</td>
                    <td style={{ ...cell, color: "var(--muted)", fontSize: "0.82rem" }}>{u.completedAt}</td>
                    <td style={cell}>
                      {u.receivedOutreach ? (
                        <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "5px", padding: "0.2rem 0.6rem", fontSize: "0.78rem", fontWeight: 600 }}>
                          Yes
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Section 3: Emails sent log ── */}
        <SectionTitle label="Emails sent" count={logTotal} loading={loading} />
        {!loading && logs.length === 0 ? (
          <EmptyBox text="No emails sent yet. Hit the button above to send now." />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Stopped at</th><th style={th}>Sent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id}
                    style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...cell, color: "var(--text)", fontWeight: 500 }}>{log.userName || "Unknown"}</td>
                    <td style={{ ...cell, color: "var(--muted)" }}>{log.userEmail}</td>
                    <td style={cell}>
                      <span style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "5px", padding: "0.2rem 0.6rem", fontSize: "0.78rem", fontWeight: 600 }}>
                        {stepLabel(log.stoppedAt)}
                      </span>
                    </td>
                    <td style={{ ...cell, color: "var(--muted)", fontSize: "0.82rem" }}>{fmt(log.sentAt)}</td>
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
