"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type Stats = {
  users: { total: number; newToday: number; newWeek: number; verified: number; free: number; pro: number; google: number };
  pageViews: { total: number; today: number; thisWeek: number; uniqueSessions: number };
  content: { totalPosts: number; postsThisWeek: number; totalSyncs: number };
};

function StatCard({ label, value, sub, color = "var(--primary)" }: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.4rem" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/v1/admin/stats")
      .then(r => r.json()).then(setStats)
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <AdminLayout>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
          Platform overview — today is {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>Loading…</div>
      ) : stats ? (
        <>
          {/* User stats */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Users</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              <StatCard label="Total Users" value={fmt(stats.users.total)} color="var(--primary)" />
              <StatCard label="New Today" value={stats.users.newToday} color="#22c55e" />
              <StatCard label="New This Week" value={stats.users.newWeek} color="#22c55e" />
              <StatCard label="Verified" value={stats.users.verified} sub={`${stats.users.total ? Math.round(stats.users.verified / stats.users.total * 100) : 0}% of total`} />
              <StatCard label="Free Plan" value={stats.users.free} color="var(--muted)" />
              <StatCard label="Pro Plan" value={stats.users.pro} color="var(--warning)" />
              <StatCard label="Google Signup" value={stats.users.google} />
            </div>
          </div>

          {/* Page view stats */}
          <div style={{ marginBottom: "0.75rem", marginTop: "1.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Visitor Traffic</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              <StatCard label="Total Page Views" value={fmt(stats.pageViews.total)} color="var(--primary)" />
              <StatCard label="Views Today" value={stats.pageViews.today} color="#22c55e" />
              <StatCard label="Views This Week" value={fmt(stats.pageViews.thisWeek)} />
              <StatCard label="Unique Sessions" value={fmt(stats.pageViews.uniqueSessions)} sub="Last 7 days" />
            </div>
          </div>

          {/* Content stats */}
          <div style={{ marginTop: "1.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Platform Activity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              <StatCard label="Total Posts" value={fmt(stats.content.totalPosts)} />
              <StatCard label="Posts This Week" value={stats.content.postsThisWeek} color="#22c55e" />
              <StatCard label="Analytics Syncs" value={fmt(stats.content.totalSyncs)} />
            </div>
          </div>

          {/* Health banner */}
          <div style={{ marginTop: "2rem", background: "rgba(36,152,255,0.06)",
            border: "1px solid rgba(36,152,255,0.2)", borderRadius: "12px",
            padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🟢</span>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.9rem" }}>All systems operational</div>
              <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                {stats.users.total} registered users · {fmt(stats.pageViews.total)} total page views · {stats.users.pro} pro subscribers
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: "var(--danger)" }}>Failed to load stats. Check backend connection.</div>
      )}
    </AdminLayout>
  );
}
