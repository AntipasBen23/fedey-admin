"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type VisitorSession = {
  visitorKey: string;
  userId: number | null;
  userEmail: string;
  country: string;
  region: string;
  latestPath: string;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
};

type PageVisit = {
  id: number;
  visitorKey: string;
  path: string;
  referrer: string;
  country: string;
  region: string;
  city: string;
  userAgent: string;
  createdAt: string;
};

type VisitorDetail = {
  visitorKey: string;
  userId: number | null;
  userEmail: string;
  country: string;
  region: string;
  city: string;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  trail: PageVisit[];
};

// ── Device/Browser parser ─────────────────────────────────────────────────────

function parseDevice(userAgent: string) {
  const ua = (userAgent || "").toLowerCase();
  const device = /mobile|iphone|android/.test(ua)
    ? "Mobile"
    : /ipad|tablet/.test(ua)
    ? "Tablet"
    : "Desktop";
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome/")
    ? "Chrome"
    : ua.includes("safari/") && !ua.includes("chrome/")
    ? "Safari"
    : ua.includes("firefox/")
    ? "Firefox"
    : "Unknown";
  const os = ua.includes("iphone") || ua.includes("ipad")
    ? "iOS"
    : ua.includes("android")
    ? "Android"
    : ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os")
    ? "macOS"
    : ua.includes("linux")
    ? "Linux"
    : "Unknown";
  return { device, browser, os };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VisitorsPage() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [selected, setSelected] = useState<VisitorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSessions = useCallback((s: string, c: string) => {
    setLoading(true);
    const params = new URLSearchParams({ search: s, country: c, limit: "100" });
    adminFetch(`/v1/admin/visitors?${params}`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSessions("", "");
  }, [fetchSessions]);

  function onSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSessions(val, country), 250);
  }

  function onCountryChange(val: string) {
    setCountry(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSessions(search, val), 250);
  }

  function selectVisitor(key: string) {
    setDetailLoading(true);
    adminFetch(`/v1/admin/visitors/${key}`)
      .then(r => r.json())
      .then(d => setSelected(d.visitor || null))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }

  const countries = Array.from(new Set(sessions.map(s => s.country).filter(Boolean))).sort();

  return (
    <AdminLayout>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Visitors</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.25rem", fontSize: "0.88rem" }}>
          Real-time session tracking — click any visitor to see their full page trail
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* ── Left panel: session list ────────────────────────────────────── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>

          {/* Filters */}
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <input
              type="text"
              placeholder="Search email, path, country…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              style={{
                width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
                border: "1px solid var(--border)", fontSize: "0.85rem",
                background: "var(--bg)", color: "var(--text)", boxSizing: "border-box",
              }}
            />
            <select
              value={country}
              onChange={e => onCountryChange(e.target.value)}
              style={{
                width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
                border: "1px solid var(--border)", fontSize: "0.85rem",
                background: "var(--bg)", color: "var(--text)",
              }}
            >
              <option value="">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Session list */}
          <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>Loading…</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>No visitors yet.</div>
            ) : (
              sessions.map(s => {
                const isAnon = !s.userEmail;
                const label = s.userEmail || `anon·${s.visitorKey.slice(0, 8)}`;
                const isActive = selected?.visitorKey === s.visitorKey;
                return (
                  <div
                    key={s.visitorKey}
                    onClick={() => selectVisitor(s.visitorKey)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      background: isActive ? "var(--primary-faint, #eff6ff)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        fontSize: "0.82rem", fontWeight: 600,
                        color: isAnon ? "var(--muted)" : "var(--text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {isAnon ? "👤 " : "✉️ "}{label}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)", flexShrink: 0 }}>
                        {timeAgo(s.lastSeen)}
                      </span>
                    </div>
                    <div style={{ marginTop: "0.3rem", fontSize: "0.77rem", color: "var(--muted)", display: "flex", gap: "0.75rem" }}>
                      <span>📍 {s.country || "Unknown"}{s.region ? `, ${s.region}` : ""}</span>
                      <span>📄 {s.pageViews} page{s.pageViews !== 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ marginTop: "0.2rem", fontSize: "0.75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.latestPath}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: visitor detail ─────────────────────────────────── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {detailLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>Loading…</div>
          ) : !selected ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
              Select a visitor to see their full profile and page trail.
            </div>
          ) : (
            <VisitorDetailPanel detail={selected} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ── Detail panel component ────────────────────────────────────────────────────

function VisitorDetailPanel({ detail }: { detail: VisitorDetail }) {
  const latestUA = detail.trail?.[0]?.userAgent || "";
  const { device, browser, os } = parseDevice(latestUA);

  const stat = (label: string, value: string) => (
    <div style={{ background: "var(--bg)", borderRadius: "8px", padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.2rem" }}>{label}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>{value || "—"}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem" }}>
          {detail.userEmail ? `✉️ ${detail.userEmail}` : `👤 Anonymous · ${detail.visitorKey.slice(0, 12)}…`}
        </div>
        <div style={{ marginTop: "0.3rem", fontSize: "0.82rem", color: "var(--muted)" }}>
          📍 {[detail.city, detail.region, detail.country].filter(Boolean).join(", ") || "Unknown location"}
          &nbsp;·&nbsp;{device} · {browser} · {os}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
          {stat("First seen", fmtDate(detail.firstSeen))}
          {stat("Last seen", fmtDate(detail.lastSeen))}
          {stat("Page views", String(detail.pageViews))}
        </div>
      </div>

      {/* Page trail */}
      <div style={{ padding: "1rem 1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.85rem" }}>
          Page Trail ({detail.trail?.length || 0} hits)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "calc(100vh - 460px)", overflowY: "auto" }}>
          {(detail.trail || []).map((hit, i) => {
            const { device: d, browser: b } = parseDevice(hit.userAgent);
            return (
              <div key={hit.id || i} style={{
                background: "var(--bg)", borderRadius: "8px", padding: "0.65rem 0.9rem",
                display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "start",
              }}>
                <div>
                  <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>
                    {hit.path}
                  </div>
                  {hit.referrer && (
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                      from: {hit.referrer}
                    </div>
                  )}
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.1rem" }}>
                    {d} · {b}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap", textAlign: "right" }}>
                  {fmtDate(hit.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
