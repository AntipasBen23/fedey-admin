"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type TimelineRow = { day: string; views: number };
type PageRow = { path: string; views: number };
type DeviceRow = { device: string; count: number };

export default function VisitorsPage() {
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [topPages, setTopPages] = useState<PageRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch("/v1/admin/visitors/timeline").then(r => r.json()),
      adminFetch("/v1/admin/visitors/top-pages").then(r => r.json()),
      adminFetch("/v1/admin/visitors/devices").then(r => r.json()),
    ]).then(([t, p, d]) => {
      setTimeline(t.timeline || []);
      setTopPages(p.pages || []);
      setDevices(d.devices || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxViews = Math.max(...timeline.map(r => r.views), 1);
  const totalDevices = devices.reduce((s, d) => s + d.count, 0);
  const deviceIcon: Record<string, string> = { mobile: "📱", tablet: "📋", desktop: "🖥️" };

  return (
    <AdminLayout>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Visitors</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>Page view analytics — last 30 days</p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>

          {/* Timeline chart */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              Daily Page Views — Last 30 Days
            </div>
            {timeline.length === 0 ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                No data yet. Page views will appear here once visitors start using the site.
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "120px", overflowX: "auto" }}>
                {timeline.map((row, i) => (
                  <div key={i} title={`${row.day}: ${row.views} views`}
                    style={{ flex: "0 0 auto", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: "4px", minWidth: "28px" }}>
                    <div style={{ width: "100%", borderRadius: "3px 3px 0 0",
                      background: "var(--primary)", opacity: 0.7 + (row.views / maxViews) * 0.3,
                      height: `${Math.max(4, (row.views / maxViews) * 100)}px`,
                      transition: "height 0.3s" }} />
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)",
                      transform: "rotate(-45deg)", transformOrigin: "top right",
                      whiteSpace: "nowrap", marginTop: "4px" }}>
                      {row.day}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Top pages */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "1.5rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>Top Pages</div>
              {topPages.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No page data yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {topPages.map((p, i) => {
                    const maxP = topPages[0]?.views || 1;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          marginBottom: "0.25rem", fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--text)", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                            {p.path || "/"}
                          </span>
                          <span style={{ color: "var(--muted)", fontWeight: 700, flexShrink: 0 }}>
                            {p.views}
                          </span>
                        </div>
                        <div style={{ height: "4px", borderRadius: "2px", background: "var(--border)" }}>
                          <div style={{ height: "100%", borderRadius: "2px",
                            background: "var(--primary)",
                            width: `${(p.views / maxP) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Device breakdown */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "1.5rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>Devices</div>
              {devices.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No device data yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {devices.map((d, i) => {
                    const pct = totalDevices ? Math.round(d.count / totalDevices * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                          <span>{deviceIcon[d.device] || "💻"} <span style={{ textTransform: "capitalize" }}>{d.device}</span></span>
                          <span style={{ color: "var(--muted)" }}>{d.count} <span style={{ fontSize: "0.75rem" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)" }}>
                          <div style={{ height: "100%", borderRadius: "4px",
                            background: i === 0 ? "var(--primary)" : i === 1 ? "#22c55e" : "#f59e0b",
                            width: `${pct}%`, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    {totalDevices.toLocaleString()} total visits in last 30 days
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
