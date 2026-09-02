import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { COLORS, inputStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { fmtDate } from "../lib/helpers.js";
import { Card, Badge } from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

const ACTION_COLORS = {
  CREATE: COLORS.good,
  UPDATE: COLORS.accent,
  DELETE: COLORS.bad,
};

const ENTITY_ICONS = {
  entry: "📊",
  page: "📄",
  staff: "👤",
  campaign: "🎯",
};

export default function AuditLogPage() {
  const { data } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  if (user?.role !== "admin") {
    return <div style={{ color: COLORS.textFaint, padding: 40, textAlign: "center" }}>Access denied.</div>;
  }

  const logs = (data.auditLog || []);

  const filtered = logs.filter((l) => {
    if (filterAction !== "all" && l.action !== filterAction) return false;
    if (filterEntity !== "all" && l.entityType !== filterEntity) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (l.userName || "").toLowerCase().includes(q) ||
        (l.entityType || "").toLowerCase().includes(q) ||
        (l.action || "").toLowerCase().includes(q) ||
        JSON.stringify(l.newValue || {}).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bt-fade">
      <PageHeader title="Audit Logs" sub={`${filtered.length} events recorded`} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textFaint }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, entity, action..."
            style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} style={selStyle}>
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }} style={selStyle}>
          <option value="all">All Entities</option>
          <option value="entry">Entries</option>
          <option value="page">Pages</option>
          <option value="staff">Staff</option>
          <option value="campaign">Campaigns</option>
        </select>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {paged.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textFaint, fontSize: 13 }}>
            No audit log entries yet. All changes to data are recorded here.
          </div>
        ) : (
          <div>
            {paged.map((log, i) => (
              <div key={log.id || i} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                borderBottom: i < paged.length - 1 ? `1px solid ${COLORS.borderSoft}` : "none",
              }}>
                {/* Icon */}
                <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                  {ENTITY_ICONS[log.entityType] || "📋"}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Badge color={ACTION_COLORS[log.action] || COLORS.textFaint}>{log.action}</Badge>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{log.entityType}</span>
                    {log.newValue?.name && <span style={{ fontSize: 12.5, color: COLORS.textSecondary }}>"{log.newValue.name}"</span>}
                    {log.oldValue?.name && !log.newValue?.name && <span style={{ fontSize: 12.5, color: COLORS.textSecondary }}>"{log.oldValue.name}"</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: COLORS.textFaint, marginTop: 3 }}>
                    by <span style={{ color: COLORS.textSecondary }}>{log.userName || "System"}</span>
                    {log.newValue?.date && <span> · {log.newValue.date}</span>}
                    {log.newValue?.spend != null && <span> · ${Number(log.newValue.spend || 0).toFixed(2)}</span>}
                  </div>
                </div>
                {/* Time */}
                <div style={{ fontSize: 11, color: COLORS.textFaint, flexShrink: 0, textAlign: "right", minWidth: 80 }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ ...paginBtnStyle, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ color: COLORS.textSecondary, fontSize: 13, padding: "6px 12px" }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ ...paginBtnStyle, opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

const selStyle = {
  padding: "7px 10px", borderRadius: 8, background: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 12.5, outline: "none",
};

const paginBtnStyle = {
  padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
  border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary,
};
