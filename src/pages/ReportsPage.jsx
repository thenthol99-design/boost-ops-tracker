import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { COLORS, primaryBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useLang } from "../hooks/useLang.jsx";
import { getVisiblePageIds } from "../lib/auth.js";
import {
  aggregateEntries, deriveMetrics, filterByDateRange,
  groupByDay, groupByWeek, groupByMonth, fmtMoney, fmtPctMetric, fmtMetric,
} from "../lib/calculations.js";
import { getDateRange, fmt, fmtDateShort } from "../lib/helpers.js";
import {
  Card, DateRangeFilter, SortableTable, MetricValue, KpiCard,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

const METRICS = [
  { key: "spend", label: "Spend", prefix: "$", decimals: 0, color: COLORS.accent },
  { key: "conversions", label: "Conversions", decimals: 0, color: COLORS.good },
  { key: "accountsCreated", label: "Accounts", decimals: 0, color: COLORS.info },
  { key: "leads", label: "Leads", decimals: 0, color: "#C77DFF" },
  { key: "visitors", label: "Visitors", decimals: 0, color: "#F0A860" },
  { key: "cpconv", label: "Cost/Conv", prefix: "$", decimals: 2, color: COLORS.bad },
  { key: "cpa", label: "Cost/Account", prefix: "$", decimals: 2, color: "#F088B6" },
  { key: "impressions", label: "Impressions", decimals: 0, color: COLORS.textSecondary },
  { key: "clicks", label: "Clicks", decimals: 0, color: COLORS.textSecondary },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.textPrimary },
  cursor: { fill: "#FFFFFF06" },
};

export default function ReportsPage() {
  const { data } = useData();
  const { user } = useAuth();
  const { T } = useLang();
  const [groupBy, setGroupBy] = useState("day"); // day | week | month
  const [preset, setPreset] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("spend");
  const [compareMode, setCompareMode] = useState(false);
  const [comparePreset, setComparePreset] = useState("last_month");

  const visibleIds = getVisiblePageIds(user, data.pageStaffAssignments);

  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    if (preset === "all") return { from: "", to: "" };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const filteredEntries = useMemo(() => {
    let es = data.entries;
    if (visibleIds !== null) es = es.filter((e) => visibleIds.includes(e.pageId));
    if (from || to) es = filterByDateRange(es, from, to);
    if (pageFilter !== "all") es = es.filter((e) => e.pageId === pageFilter);
    if (staffFilter !== "all") {
      const staffPages = data.pages.filter((p) => p.staffId === staffFilter).map((p) => p.id);
      es = es.filter((e) => staffPages.includes(e.pageId));
    }
    return es;
  }, [data, visibleIds, from, to, pageFilter, staffFilter]);

  // Compare period entries
  const compareEntries = useMemo(() => {
    if (!compareMode) return [];
    const cr = getDateRange(comparePreset);
    let es = data.entries;
    if (visibleIds !== null) es = es.filter((e) => visibleIds.includes(e.pageId));
    if (cr.from || cr.to) es = filterByDateRange(es, cr.from, cr.to);
    if (pageFilter !== "all") es = es.filter((e) => e.pageId === pageFilter);
    return es;
  }, [data, visibleIds, compareMode, comparePreset, pageFilter]);

  // Group current period
  const grouped = useMemo(() => {
    if (groupBy === "week") return groupByWeek(filteredEntries).map((w) => ({ label: fmtDateShort(w.weekStart), ...w }));
    if (groupBy === "month") return groupByMonth(filteredEntries).map((m) => ({ label: m.label, ...m }));
    return groupByDay(filteredEntries).map((d) => ({ label: fmtDateShort(d.date), ...d }));
  }, [filteredEntries, groupBy]);

  // Group compare period
  const compareGrouped = useMemo(() => {
    if (!compareMode || compareEntries.length === 0) return [];
    if (groupBy === "week") return groupByWeek(compareEntries).map((w) => ({ label: `[Prev] ${fmtDateShort(w.weekStart)}`, ...w }));
    if (groupBy === "month") return groupByMonth(compareEntries).map((m) => ({ label: `[Prev] ${m.label}`, ...m }));
    return groupByDay(compareEntries).map((d) => ({ label: `[Prev] ${fmtDateShort(d.date)}`, ...d }));
  }, [compareEntries, groupBy, compareMode]);

  const totals = useMemo(() => deriveMetrics(aggregateEntries(filteredEntries)), [filteredEntries]);
  const compareTotals = useMemo(() => deriveMetrics(aggregateEntries(compareEntries)), [compareEntries]);

  const metric = METRICS.find((m) => m.key === selectedMetric);
  const visiblePages = visibleIds !== null ? data.pages.filter((p) => visibleIds.includes(p.id)) : data.pages;

  // Page breakdown table
  const pageBreakdown = useMemo(() => visiblePages.map((p) => {
    const es = filteredEntries.filter((e) => e.pageId === p.id);
    const m = deriveMetrics(aggregateEntries(es));
    return { ...p, ...m };
  }), [visiblePages, filteredEntries]);

  return (
    <div className="bt-fade">
      <PageHeader title={T("reports")} sub={T("analyze")} />

      {/* Date filter */}
      <Card style={{ marginBottom: 14, padding: "12px 14px" }}>
        <DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />
      </Card>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={filterSel}>
          <option value="all">{T("all_pages")}</option>
          {visiblePages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {user?.role === "admin" && (
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={filterSel}>
            <option value="all">{T("all_staff")}</option>
            {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["day", "week", "month"].map((g) => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              padding: "7px 13px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", textTransform: "capitalize",
              border: `1px solid ${groupBy === g ? COLORS.accent : COLORS.border}`,
              background: groupBy === g ? `${COLORS.accent}1A` : COLORS.surface,
              color: groupBy === g ? COLORS.accent : COLORS.textSecondary,
            }}>{T(g)}</button>
          ))}
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: T("total_spend"),   v: fmtMoney(totals.spend),               cv: fmtMoney(compareTotals.spend) },
          { label: T("conversions"),   v: fmt(totals.conversions, 0),           cv: fmt(compareTotals.conversions, 0) },
          { label: T("total_leads"),   v: fmt(totals.leads, 0),                 cv: fmt(compareTotals.leads, 0) },
          { label: T("cost_per_conv"), v: fmtMoney(totals.cpconv),              cv: fmtMoney(compareTotals.cpconv) },
        ].map(({ label, v, cv }) => (
          <Card key={label} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>{label}</div>
            <div className="bt-mono" style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
            {compareMode && <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 3 }}>vs {cv}</div>}
          </Card>
        ))}
      </div>

      {/* Metric selector */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => setSelectedMetric(m.key)} style={{
                padding: "5px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: `1px solid ${selectedMetric === m.key ? m.color : COLORS.border}`,
                background: selectedMetric === m.key ? `${m.color}1A` : "transparent",
                color: selectedMetric === m.key ? m.color : COLORS.textSecondary,
              }}>{m.label}</button>
            ))}
          </div>
          <button onClick={() => setCompareMode(!compareMode)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
            border: `1px solid ${compareMode ? COLORS.info : COLORS.border}`,
            background: compareMode ? `${COLORS.info}1A` : "transparent",
            color: compareMode ? COLORS.info : COLORS.textSecondary,
            flexShrink: 0,
          }}>{T("compare")}</button>
        </div>

        {compareMode && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {["yesterday", "last_week", "last_month"].map((p) => (
              <button key={p} onClick={() => setComparePreset(p)} style={{
                padding: "5px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: `1px solid ${comparePreset === p ? COLORS.info : COLORS.border}`,
                background: comparePreset === p ? `${COLORS.info}1A` : "transparent",
                color: comparePreset === p ? COLORS.info : COLORS.textSecondary,
              }}>{p.replace("_", " ")}</button>
            ))}
          </div>
        )}

        {/* Chart */}
        {grouped.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grouped} barGap={2}>
              <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} width={45}
                tickFormatter={(v) => metric?.prefix ? `${metric.prefix}${v}` : v} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${metric?.prefix || ""}${fmt(v, metric?.decimals ?? 0)}`, metric?.label]} />
              <Bar dataKey={selectedMetric} fill={metric?.color || COLORS.accent} radius={[3, 3, 0, 0]} name={metric?.label} />
              {compareMode && compareGrouped.length > 0 && (
                <Bar dataKey={selectedMetric} data={compareGrouped} fill={COLORS.info} fillOpacity={0.5} radius={[3, 3, 0, 0]} name="Previous" />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textFaint, fontSize: 12.5 }}>
            No data for this period
          </div>
        )}
      </Card>

      {/* Page breakdown table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          {T("page_breakdown")}
        </div>
        <SortableTable
          columns={[
            { key: "name", label: "Page", render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
                <span style={{ fontWeight: 600 }}>{r.name}</span>
              </div>
            )},
            { key: "spend",          label: "ចំណាយ",             align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
            { key: "leads",          label: "ឆាតចូល",            align: "right", render: (r) => <MetricValue value={r.leads} decimals={0} highlight="#C77DFF" /> },
            { key: "conversions",    label: "អ្នកដាក់ប្រាក់",     align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} highlight={COLORS.good} /> },
            { key: "cpconv",         label: "តម្លៃ/ដាក់ប្រាក់",  align: "right", sortVal: (r) => r.cpconv ?? Infinity, render: (r) => <MetricValue value={r.cpconv} prefix="$" highlight={r.cpconv !== null ? (r.cpconv < 20 ? COLORS.good : COLORS.bad) : undefined} /> },
          ]}
          rows={pageBreakdown}
          emptyMsg="No data for this period"
        />
      </Card>
    </div>
  );
}

const filterSel = {
  padding: "7px 10px", borderRadius: 8, background: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 12.5,
  outline: "none", cursor: "pointer",
};
