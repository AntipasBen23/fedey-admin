"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type ActivityItem = {
  type: string; detail: string; platform: string; status: string; createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  posted:  "var(--success)",
  pending: "var(--warning)",
  failed:  "var(--danger)",
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: "𝕏", x: "𝕏", linkedin: "in", instagram: "📸",
};

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "posted" | "pending" | "failed">("all");

  useEffect(() => {
    adminFetch("/v1/admin/activity")
      .then(r => r.json())
      .then(d => setItems(d.activity || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const counts = { posted: 0, pending: 0, failed: 0 };
  items.forEach(i => { if (i.status in counts) counts[i.status as keyof typeof counts]++; });

  return (
    <AdminLayout>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Platform Activity</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>Recent posts created across all accounts</p>
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {(["all", "posted", "pending", "failed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "0.4rem 0.9rem", borderRadius: "20px", fontWeight: 700,
              fontSize: "0.8rem", cursor: "pointer", border: "1.5px solid",
              borderColor: filter === f ? "var(--primary)" : "var(--border)",
              background: filter === f ? "rgba(36,152,255,0.12)" : "var(--surface)",
              color: filter === f ? "var(--primary)" : "var(--muted)",
              textTransform: "capitalize" }}>
            {f === "all" ? `All (${items.length})` : `${f} (${counts[f as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1.2fr",
          padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)",
          fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)",
          textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>Content</span><span>Platform</span><span>Status</span><span>Created</span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            No activity yet.
          </div>
        ) : filtered.map((item, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1.2fr",
            padding: "0.85rem 1rem", alignItems: "center",
            borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
            fontSize: "0.85rem",
          }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              paddingRight: "1rem", color: "var(--text)" }}>
              {item.detail || "—"}
            </span>
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>
              {PLATFORM_ICONS[item.platform?.toLowerCase()] || item.platform || "—"}
            </span>
            <span>
              <span style={{ display: "inline-block", padding: "0.2rem 0.55rem",
                borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
                background: `${STATUS_COLORS[item.status] || "var(--muted)"}18`,
                color: STATUS_COLORS[item.status] || "var(--muted)",
                textTransform: "capitalize" }}>
                {item.status}
              </span>
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
              {new Date(item.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
