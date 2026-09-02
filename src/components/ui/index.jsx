import React from "react";
import { createPortal } from "react-dom";
import { COLORS, cardShadow } from "../../lib/colors.js";
import { fmt, clamp, initials } from "../../lib/helpers.js";
import { useLang } from "../../hooks/useLang.jsx";

// ── Field wrapper ──────────────────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
        {label}{required && <span style={{ color: COLORS.bad }}> *</span>}
      </div>
      {children}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({ name, color, size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size, background: `${color}2A`, border: `1px solid ${color}66`,
      color, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }} className="bt-mono">
      {initials(name)}
    </div>
  );
}

// ── StatChip ───────────────────────────────────────────────────────────────
export function StatChip({ icon: Icon, label, value, accent, sub }) {
  return (
    <div style={{
      background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`,
      borderRadius: 10, padding: "9px 10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {Icon && <Icon size={12} style={{ color: accent || COLORS.textSecondary }} />}
        <span style={{ fontSize: 10.5, color: COLORS.textSecondary }}>{label}</span>
      </div>
      <div className="bt-mono" style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.textFaint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── KPI Card (bigger, for dashboard) ──────────────────────────────────────
export function KpiCard({ icon: Icon, label, value, sub, accent, trend, trendLabel }) {
  const trendPositive = trend !== null && trend !== undefined && trend >= 0;
  const trendNegative = trend !== null && trend !== undefined && trend < 0;
  return (
    <div className="bt-card" style={{
      background: COLORS.surface, border: `1px solid ${COLORS.borderSoft}`,
      borderRadius: 14, padding: "14px 16px", boxShadow: cardShadow,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: `${accent || COLORS.accent}1A`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {Icon && <Icon size={15} style={{ color: accent || COLORS.accent }} />}
        </div>
        <span style={{ fontSize: 11.5, color: COLORS.textSecondary }}>{label}</span>
      </div>
      <div className="bt-display" style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 4 }}>{sub}</div>}
      {(trend !== null && trend !== undefined) && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6,
          fontSize: 11, fontWeight: 600,
          color: trendPositive ? COLORS.good : trendNegative ? COLORS.bad : COLORS.textFaint,
        }}>
          {trendPositive ? "↑" : trendNegative ? "↓" : "→"}
          {Math.abs(trend).toFixed(1)}%
          {trendLabel && <span style={{ color: COLORS.textFaint, fontWeight: 400 }}> {trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ── CostGauge ──────────────────────────────────────────────────────────────
export function CostGauge({ cost, target, size = "md", label = "Cost / Conversion" }) {
  const hasCost = isFinite(cost) && cost > 0;
  const hasTarget = target > 0;
  const h = size === "sm" ? 10 : 14;

  if (!hasCost) {
    return (
      <div style={{ fontSize: 11.5, color: COLORS.textFaint, padding: "6px 0" }}>
        No data yet
      </div>
    );
  }

  if (!hasTarget) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span className="bt-mono" style={{ fontSize: size === "sm" ? 12 : 13, color: COLORS.textSecondary }}>{label}</span>
        <span className="bt-display" style={{ fontSize: size === "sm" ? 18 : 22, fontWeight: 700, color: COLORS.textPrimary }}>${fmt(cost, 2)}</span>
      </div>
    );
  }

  const max = target * 1.6;
  const pct = clamp((cost / max) * 100, 3, 100);
  const tickPct = (target / max) * 100;
  const color = cost <= target * 0.85 ? COLORS.good : cost <= target * 1.15 ? COLORS.accent : COLORS.bad;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="bt-mono" style={{ fontSize: size === "sm" ? 12 : 13, color: COLORS.textSecondary, letterSpacing: 0.3 }}>
          {label}
        </span>
        <span className="bt-display" style={{ fontSize: size === "sm" ? 18 : 22, fontWeight: 700, color }}>${fmt(cost, 2)}</span>
      </div>
      <div style={{ position: "relative", height: h, borderRadius: h, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, width: `${pct}%`, borderRadius: h,
          background: `linear-gradient(90deg, ${COLORS.good}, ${color})`,
          transition: "width .5s cubic-bezier(.4,0,.2,1)",
        }} />
        <div style={{ position: "absolute", left: `${tickPct}%`, top: -2, bottom: -2, width: 2, background: "#0B0D13", boxShadow: "0 0 0 1px #FFFFFF55" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span className="bt-mono" style={{ fontSize: 10, color: COLORS.textFaint }}>$0</span>
        <span className="bt-mono" style={{ fontSize: 10, color: COLORS.textFaint }}>Target ${fmt(target)}</span>
        <span className="bt-mono" style={{ fontSize: 10, color: COLORS.textFaint }}>${fmt(max)}</span>
      </div>
    </div>
  );
}

// ── ProgressRow ────────────────────────────────────────────────────────────
export function ProgressRow({ label, actual, target, unit = "" }) {
  const pct = target > 0 ? clamp((actual / target) * 100, 0, 130) : 0;
  const over = target > 0 && actual > target;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: COLORS.textSecondary }}>{label}</span>
        <span className="bt-mono" style={{ color: COLORS.textPrimary }}>
          {unit}{fmt(actual)} <span style={{ color: COLORS.textFaint }}>/ {unit}{fmt(target)}</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: COLORS.surfaceAlt, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: over ? COLORS.good : COLORS.accent, transition: "width .4s" }} />
      </div>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color, size = "sm" }) {
  const c = color || COLORS.textSecondary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: size === "sm" ? 10.5 : 12,
      color: c, background: `${c}1A`,
      border: `1px solid ${c}44`,
      padding: size === "sm" ? "1px 7px" : "3px 10px",
      borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active: { label: "Active", color: COLORS.good },
    inactive: { label: "Inactive", color: COLORS.textFaint },
    paused: { label: "Paused", color: COLORS.accent },
    archived: { label: "Archived", color: COLORS.textFaint },
    ended: { label: "Ended", color: COLORS.textFaint },
    completed: { label: "Completed", color: COLORS.info },
  };
  const { label, color } = map[status] || { label: status, color: COLORS.textFaint };
  return <Badge color={color}>{label}</Badge>;
}

// ── Metric value display ────────────────────────────────────────────────────
export function MetricValue({ value, prefix = "", suffix = "", decimals = 2, highlight }) {
  const isNull = value === null || value === undefined || !isFinite(value);
  return (
    <span className="bt-mono" style={{
      color: isNull ? COLORS.textFaint : highlight || COLORS.textPrimary,
      fontSize: "inherit",
    }}>
      {isNull ? "—" : `${prefix}${fmt(value, decimals)}${suffix}`}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: COLORS.good,
    error: COLORS.bad,
    info: COLORS.accent,
  };
  const border = colors[toast.type] || COLORS.border;
  return (
    <div style={{
      position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
      background: COLORS.surfaceAlt, border: `1px solid ${border}`,
      borderRadius: 8, padding: "9px 16px", fontSize: 13, zIndex: 9999,
      boxShadow: cardShadow, display: "flex", alignItems: "center", gap: 8,
      whiteSpace: "nowrap", maxWidth: "90vw",
    }} className="bt-fade">
      {toast.type === "success" && <span style={{ color: COLORS.good }}>✓</span>}
      {toast.type === "error" && <span style={{ color: COLORS.bad }}>✕</span>}
      {toast.type === "info" && <span style={{ color: COLORS.accent }}>●</span>}
      <span>{toast.msg}</span>
    </div>
  );
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────
export function ConfirmDialog({ message, onConfirm, onCancel, danger = true }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000099",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 80, padding: "0 20px",
    }} onClick={onCancel}>
      <div className="bt-fade" onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: "22px 22px 20px", width: "100%", maxWidth: 380,
        boxShadow: cardShadow,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: danger ? `${COLORS.bad}1A` : `${COLORS.accent}1A`,
          border: `1px solid ${danger ? COLORS.bad : COLORS.accent}44`,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          fontSize: 18,
        }}>
          {danger ? "⚠️" : "❓"}
        </div>
        <div className="bt-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          {danger ? "Confirm Delete" : "Confirm Action"}
        </div>
        <div style={{ fontSize: 13.5, color: COLORS.textSecondary, marginBottom: 22, lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary, fontWeight: 600,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: "none", background: danger ? COLORS.bad : COLORS.accent, color: "#fff", fontWeight: 700,
          }}>{danger ? "Delete" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal shell ────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 520 }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, background: "#00000099",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "16px", overflowY: "auto",
    }} onClick={onClose}>
      <div className="bt-fade" onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 22, width: "100%", maxWidth: width,
        maxHeight: "90vh", overflowY: "auto", boxShadow: cardShadow,
        margin: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div className="bt-display" style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: COLORS.textFaint,
            cursor: "pointer", fontSize: 20, padding: "0 4px",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── SortableTable ──────────────────────────────────────────────────────────
export function SortableTable({ columns, rows, onRowClick, emptyMsg = "No data" }) {
  const [sortKey, setSortKey] = React.useState(columns[0]?.key);
  const [sortDir, setSortDir] = React.useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...rows].sort((a, b) => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return 0;
    const va = col.sortVal ? col.sortVal(a) : (a[sortKey] ?? 0);
    const vb = col.sortVal ? col.sortVal(b) : (b[sortKey] ?? 0);
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  return (
    <div className="bt-scrollbar" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{
                  padding: "10px 12px", textAlign: col.align || "left",
                  fontSize: 11, color: sortKey === col.key ? COLORS.accent : COLORS.textSecondary,
                  fontWeight: 600, whiteSpace: "nowrap", userSelect: "none",
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: col.sortable !== false ? "pointer" : "default",
                  background: COLORS.surface,
                }}>
                {col.label}
                {col.sortable !== false && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} style={{
              textAlign: "center", padding: 32, color: COLORS.textFaint, fontSize: 13,
            }}>{emptyMsg}</td></tr>
          )}
          {sorted.map((row, i) => (
            <tr key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: `1px solid ${COLORS.borderSoft}`,
                cursor: onRowClick ? "pointer" : "default",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => onRowClick && (e.currentTarget.style.background = COLORS.surfaceAlt)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: "11px 12px", textAlign: col.align || "left", whiteSpace: "nowrap",
                  color: COLORS.textPrimary,
                }}>
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div className="bt-display" style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 }}>{sub}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Card wrapper ────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, className = "" }) {
  return (
    <div className={`bt-card ${className}`}
      onClick={onClick}
      style={{
        background: COLORS.surface, border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: 14, padding: 16, boxShadow: cardShadow,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}>
      {children}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{
      textAlign: "center", padding: "48px 20px",
      border: `1px dashed ${COLORS.border}`, borderRadius: 14,
    }}>
      {icon && <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>}
      <div className="bt-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── Date range filter strip ────────────────────────────────────────────────
export function DateRangeFilter({ preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo }) {
  const { T } = useLang();
  const presets = [
    { l: T("today"),      v: "today" },
    { l: T("yesterday"),  v: "yesterday" },
    { l: T("this_week"),  v: "this_week" },
    { l: T("last_week"),  v: "last_week" },
    { l: T("this_month"), v: "this_month" },
    { l: T("last_month"), v: "last_month" },
    { l: T("all_time"),   v: "all" },
    { l: T("custom"),     v: "custom" },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", flexWrap: "wrap" }} className="bt-scrollbar">
        {presets.map((p) => (
          <button key={p.v} onClick={() => setPreset(p.v)} style={{
            padding: "6px 13px", borderRadius: 20, fontSize: 12.5, whiteSpace: "nowrap", cursor: "pointer",
            border: `1px solid ${preset === p.v ? COLORS.accent : COLORS.border}`,
            background: preset === p.v ? "#E8B24D1F" : COLORS.surface,
            color: preset === p.v ? COLORS.accent : COLORS.textSecondary,
          }}>{p.l}</button>
        ))}
      </div>
      {preset === "custom" && (
        <div style={{
          display: "flex", gap: 8, marginTop: 8, background: COLORS.surface,
          border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px",
          alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{T("from")}</span>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 7, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 12, outline: "none" }} />
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{T("to")}</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 7, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 12, outline: "none" }} />
          {(customFrom || customTo) && (
            <button onClick={() => { setCustomFrom(""); setCustomTo(""); }}
              style={{ fontSize: 11, color: COLORS.textFaint, background: "none", border: "none", cursor: "pointer" }}>
              × Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
