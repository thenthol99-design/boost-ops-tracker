import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Users, Target,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import { COLORS } from "../lib/colors.js";
import {
  aggregateEntries, deriveMetrics, filterByDateRange, groupByDay,
  fmtMoney,
} from "../lib/calculations.js";
import { getDateRange, fmt, fmtDateShort } from "../lib/helpers.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useLang } from "../hooks/useLang.jsx";
import { getVisiblePageIds } from "../lib/auth.js";
import {
  KpiCard, DateRangeFilter, Card, SortableTable, Avatar, MetricValue, Badge,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, fontSize: 12, color: COLORS.textPrimary,
  },
  cursor: { fill: "#FFFFFF06" },
};

export default function DashboardPage() {
  const { data } = useData();
  const { user } = useAuth();
  const { T } = useLang();
  const navigate = useNavigate();
  const [preset, setPreset] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  // Determine which pages this user can see
  const visibleIds = getVisiblePageIds(user, data.pageStaffAssignments);

  // Get date range
  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    if (preset === "all") return { from: "", to: "" };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let es = data.entries;
    // Role filter
    if (visibleIds !== null) es = es.filter((e) => visibleIds.includes(e.pageId));
    // Date filter
    if (from || to) es = filterByDateRange(es, from, to);
    // Page filter
    if (pageFilter !== "all") es = es.filter((e) => e.pageId === pageFilter);
    // Staff filter
    if (staffFilter !== "all") {
      const staffPages = data.pages.filter((p) => p.staffId === staffFilter).map((p) => p.id);
      es = es.filter((e) => staffPages.includes(e.pageId));
    }
    // Campaign filter
    if (campaignFilter !== "all") es = es.filter((e) => e.campaignId === campaignFilter);
    return es;
  }, [data, visibleIds, from, to, pageFilter, staffFilter, campaignFilter]);

  const metrics = useMemo(() => deriveMetrics(aggregateEntries(filteredEntries)), [filteredEntries]);

  // Previous period for comparison
  const prevMetrics = useMemo(() => {
    if (preset === "all" || preset === "custom") return null;
    const range = getDateRange(preset);
    const span = range.from && range.to
      ? Math.ceil((new Date(range.to) - new Date(range.from)) / 86400000) + 1
      : 30;
    const prevTo = new Date(new Date(range.from + "T00:00:00").getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - (span - 1) * 86400000);
    const ymd = (d) => d.toISOString().slice(0, 10);
    let prevEs = data.entries;
    if (visibleIds !== null) prevEs = prevEs.filter((e) => visibleIds.includes(e.pageId));
    prevEs = filterByDateRange(prevEs, ymd(prevFrom), ymd(prevTo));
    return deriveMetrics(aggregateEntries(prevEs));
  }, [data.entries, preset, visibleIds]);

  const trendPct = (field) => {
    if (!prevMetrics) return undefined;
    const cur = metrics[field] ?? 0;
    const prev = prevMetrics[field] ?? 0;
    if (prev === 0) return undefined;
    return ((cur - prev) / prev) * 100;
  };

  // Spend over time chart
  const spendTrend = useMemo(() => {
    const days = groupByDay(filteredEntries).slice(-30);
    return days.map((d) => ({ date: fmtDateShort(d.date), spend: Math.round(d.spend) }));
  }, [filteredEntries]);

  // Conversions over time
  const convTrend = useMemo(() => {
    return groupByDay(filteredEntries).slice(-30).map((d) => ({
      date: fmtDateShort(d.date), conversions: d.conversions, leads: d.leads,
    }));
  }, [filteredEntries]);

  // Page performance table
  const pageRows = useMemo(() => {
    const pages = visibleIds !== null
      ? data.pages.filter((p) => visibleIds.includes(p.id))
      : data.pages;
    return pages.map((p) => {
      const es = filteredEntries.filter((e) => e.pageId === p.id);
      const agg = aggregateEntries(es);
      const m = deriveMetrics(agg);
      const staffMember = data.staff.find((s) => s.id === p.staffId);
      return { ...p, ...m, staffName: staffMember?.name || "—", staffColor: staffMember?.color };
    }).filter((r) => r.count > 0 || true);
  }, [data.pages, data.staff, filteredEntries, visibleIds]);

  const visiblePages = visibleIds !== null
    ? data.pages.filter((p) => visibleIds.includes(p.id))
    : data.pages;

  return (
    <div className="bt-fade">
      <PageHeader
        title={T("dashboard")}
        sub={`${T("perf_overview")} · ${from && to ? `${from} – ${to}` : preset.replace("_", " ")}`}
      />

      {/* Date range */}
      <Card style={{ marginBottom: 16, padding: "12px 14px" }}>
        <DateRangeFilter
          preset={preset} setPreset={setPreset}
          customFrom={customFrom} setCustomFrom={setCustomFrom}
          customTo={customTo} setCustomTo={setCustomTo}
        />
      </Card>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={filterSelectStyle}>
          <option value="all">{T("all_pages")}</option>
          {visiblePages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {user?.role === "admin" && (
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={filterSelectStyle}>
            <option value="all">{T("all_staff")}</option>
            {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} style={filterSelectStyle}>
          <option value="all">{T("all_campaigns")}</option>
          {data.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <KpiCard icon={DollarSign} label={T("total_spend")} value={fmtMoney(metrics.spend)} accent={COLORS.accent} trend={trendPct("spend")} trendLabel={"vs prev"} />
        <KpiCard icon={Users} label={T("total_leads")} value={fmt(metrics.leads)} accent="#C77DFF" trend={trendPct("leads")} />
        <KpiCard icon={Target} label={T("conversions")} value={fmt(metrics.conversions)} accent={COLORS.good} trend={trendPct("conversions")} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Spend over time */}
        <Card>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 12 }}>{T("total_spend_label")}</div>
          {spendTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={spendTrend}>
                <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`$${fmt(v, 2)}`, "Spend"]} />
                <Line type="monotone" dataKey="spend" stroke={COLORS.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </Card>

        {/* Leads + Depositors over time */}
        <Card>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 12 }}>ឆាតចូល & អ្នកដាក់ប្រាក់</div>
          {convTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={convTrend}>
                <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="leads" stroke="#C77DFF" strokeWidth={2} dot={false} name="ឆាតចូល" />
                <Line type="monotone" dataKey="conversions" stroke={COLORS.good} strokeWidth={2} dot={false} name="អ្នកដាក់ប្រាក់" />
              </LineChart>
            </ResponsiveContainer>
          ) : <ChartEmpty />}
        </Card>
      </div>

      {/* Page Performance Table */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{T("page_performance")}</div>
        <SortableTable
          columns={PAGE_COLUMNS}
          rows={pageRows}
          onRowClick={(row) => navigate(`/pages/${row.id}`)}
          emptyMsg="No data for this period"
        />
      </Card>

      {/* Staff leaderboard */}
      {user?.role === "admin" && data.staff.length > 0 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{T("staff_performance")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.staff.map((s) => {
              const sPages = data.pages.filter((p) => p.staffId === s.id);
              const sEntries = filteredEntries.filter((e) => sPages.some((p) => p.id === e.pageId));
              const m = deriveMetrics(aggregateEntries(sEntries));
              return (
                <div key={s.id} onClick={() => navigate(`/staff/${s.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 10, background: COLORS.surfaceAlt, cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.border}
                  onMouseLeave={(e) => e.currentTarget.style.background = COLORS.surfaceAlt}
                >
                  <Avatar name={s.name} color={s.color} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textFaint }}>
                      {sPages.length} pages · {fmt(m.conversions)} conversions
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="bt-mono" style={{ fontSize: 15, fontWeight: 700 }}>{fmtMoney(m.cpconv)}</div>
                    <div style={{ fontSize: 10, color: COLORS.textFaint }}>cost/conv</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

const filterSelectStyle = {
  padding: "7px 10px", borderRadius: 8,
  background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary, fontSize: 12.5, outline: "none", cursor: "pointer",
};

function ChartEmpty() {
  return (
    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textFaint, fontSize: 12.5 }}>
      Not enough data yet
    </div>
  );
}

const PAGE_COLUMNS = [
  { key: "name", label: "Page", render: (r) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color, flexShrink: 0 }} />
      <span style={{ fontWeight: 600 }}>{r.name}</span>
    </div>
  )},
  { key: "staffName", label: "Staff", render: (r) => r.staffColor ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Avatar name={r.staffName} color={r.staffColor} size={18} />
      <span style={{ fontSize: 12.5 }}>{r.staffName}</span>
    </div>
  ) : <span style={{ color: COLORS.textFaint }}>—</span>},
  { key: "spend",       label: "ចំណាយ",        align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
  { key: "leads",       label: "ឆាតចូល",       align: "right", render: (r) => <MetricValue value={r.leads} decimals={0} highlight="#C77DFF" /> },
  { key: "conversions", label: "អ្នកដាក់ប្រាក់", align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} highlight={COLORS.good} /> },
];
