"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/api";

type User = {
  id: number; name: string; email: string; plan: string;
  isVerified: boolean; signupMethod: string; createdAt: string; lastLoginAt?: string;
};

type UsersResponse = { users: User[]; total: number; page: number; pages: number };

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<User | null>(null);
  const [planModal, setPlanModal] = useState<User | null>(null);

  const load = useCallback(async (q = search, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("search", q);
      const r = await adminFetch(`/v1/admin/users?${params}`);
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  const deleteUser = async (user: User) => {
    setDeleting(user.id);
    try {
      await adminFetch(`/v1/admin/users/${user.id}`, { method: "DELETE" });
      setConfirm(null);
      load();
    } catch {} finally { setDeleting(null); }
  };

  const updatePlan = async (userId: number, plan: string) => {
    await adminFetch(`/v1/admin/users/${userId}/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan }),
    });
    setPlanModal(null);
    load();
  };

  const fmtDate = (d?: string) => !d ? "—" :
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fmtTime = (d?: string) => !d ? "Never" :
    new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Users</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
            {data ? `${data.total} registered user${data.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ padding: "0.55rem 0.9rem", borderRadius: "8px",
              border: "1.5px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text)", fontSize: "0.85rem", width: "240px", outline: "none" }} />
          <button type="submit" style={{ padding: "0.55rem 1rem", borderRadius: "8px",
            background: "var(--primary)", color: "#fff", fontWeight: 700,
            border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); load("", 1); }}
              style={{ padding: "0.55rem 0.75rem", borderRadius: "8px",
                background: "var(--surface-2)", color: "var(--muted)",
                border: "1px solid var(--border)", cursor: "pointer", fontSize: "0.85rem" }}>
              Clear
            </button>
          )}
        </form>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.5fr 1fr",
          padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)",
          fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)",
          textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>Name</span><span>Email</span><span>Plan</span>
          <span>Verified</span><span>Method</span><span>Last Login</span><span>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading users…</div>
        ) : !data?.users.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            {search ? "No users match your search." : "No users yet."}
          </div>
        ) : data.users.map((u, i) => (
          <div key={u.id} style={{
            display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1.5fr 1fr",
            padding: "0.85rem 1rem", alignItems: "center",
            borderBottom: i < data.users.length - 1 ? "1px solid var(--border)" : "none",
            fontSize: "0.85rem",
            transition: "background 0.1s",
          }}>
            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "0.5rem" }}>
              {u.name || "—"}
            </span>
            <span style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "0.5rem" }}>
              {u.email}
            </span>
            <span>
              <span style={{ display: "inline-block", padding: "0.2rem 0.55rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
                background: u.plan === "pro" ? "rgba(245,158,11,0.15)" : "rgba(122,136,153,0.15)",
                color: u.plan === "pro" ? "var(--warning)" : "var(--muted)" }}>
                {u.plan.toUpperCase()}
              </span>
            </span>
            <span>
              {u.isVerified
                ? <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                : <span style={{ color: "var(--danger)" }}>✗</span>}
            </span>
            <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>
              {u.signupMethod === "google" ? "🔵 Google" : "✉️ Email"}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{fmtTime(u.lastLoginAt)}</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={() => setPlanModal(u)}
                style={{ padding: "0.3rem 0.55rem", borderRadius: "6px", border: "1px solid var(--border)",
                  background: "var(--surface-2)", color: "var(--muted)",
                  cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>
                Plan
              </button>
              <button onClick={() => setConfirm(u)}
                style={{ padding: "0.3rem 0.55rem", borderRadius: "6px",
                  border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)",
                  color: "var(--danger)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          gap: "0.5rem", marginTop: "1.25rem" }}>
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(search, page - 1); }}
            style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--border)",
              background: "var(--surface)", color: page <= 1 ? "var(--muted)" : "var(--text)",
              cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: "0.85rem" }}>
            ← Prev
          </button>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => { setPage(p => p + 1); load(search, page + 1); }}
            style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--border)",
              background: "var(--surface)", color: page >= data.pages ? "var(--muted)" : "var(--text)",
              cursor: page >= data.pages ? "not-allowed" : "pointer", fontSize: "0.85rem" }}>
            Next →
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", padding: "2rem",
            maxWidth: "400px", width: "100%", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Delete user?</h3>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: "var(--text)" }}>{confirm.email}</strong> and all their data. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setConfirm(null)}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px",
                  border: "1px solid var(--border)", background: "var(--surface-2)",
                  color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => deleteUser(confirm)} disabled={deleting === confirm.id}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none",
                  background: "var(--danger)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                {deleting === confirm.id ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", padding: "2rem",
            maxWidth: "360px", width: "100%", border: "1px solid var(--border)" }}>
            <h3 style={{ fontWeight: 800, marginBottom: "0.4rem" }}>Change Plan</h3>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              {planModal.email} — currently on <strong>{planModal.plan}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {["free", "pro"].map(p => (
                <button key={p} onClick={() => updatePlan(planModal.id, p)}
                  style={{ padding: "0.75rem", borderRadius: "8px",
                    border: `1.5px solid ${planModal.plan === p ? "var(--primary)" : "var(--border)"}`,
                    background: planModal.plan === p ? "rgba(36,152,255,0.1)" : "var(--surface-2)",
                    color: planModal.plan === p ? "var(--primary)" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", textTransform: "capitalize", fontSize: "0.9rem" }}>
                  {p === "pro" ? "⭐ Pro" : "Free"} {planModal.plan === p ? "(current)" : ""}
                </button>
              ))}
              <button onClick={() => setPlanModal(null)}
                style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border)",
                  background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
