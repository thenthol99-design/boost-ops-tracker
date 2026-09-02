import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { COLORS, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { aggregateEntries, deriveMetrics, groupByMonth, fmtMoney, fmtPctMetric } from "../lib/calculations.js";
import { fmt } from "../lib/helpers.js";
import { Card, Avatar, StatusBadge, StatChip, MetricValue, SortableTable, Badge } from "../components/ui/index.jsx";

export default function StaffDetailPage() {
  const { id } = useParams();
  const { data } = useData();
  const navigate = useNavigate();

  const staffMember = data.staff.find((s) => s.id === id);
  if (!staffMember) return (
    <div style={{ color: COLORS.textFaint, textAlign: "center", padding: 60 }}>
      Staff member not found. <button onClick={() => navigate("/staff")} style={{ color: COLORS.accent, background: "none", border: "none", cursor: "pointer" }}>Back</button>
    </div>
  );

  const pages = data.pages.filter((p) => p.staffId === id);
  const entries = data.entries.filter((e) => pages.some((p) => p.id === e.pageId));
  const allTimeMetrics = useMemo(() => deriveMetrics(aggregateEntries(entries)), [entries]);

  const monthlyData = useMemo(() => groupByMonth(entries).slice(-6).map((m) => ({
    label: m.label.slice(0, 3) + " " + m.month.slice(0, 4),
    spend: Math.round(m.spend),
    conversions: m.conversions,
  })), [entries]);

  const pageRows = useMemo(() => pages.map((p) => {
    const es = entries.filter((e) => e.pageId === p.id);
    const m = deriveMetrics(aggregateEntries(es));
    return { ...p, ...m };
  }), [pages, entries]);

  return (
    <div className="bt-fade">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("/staff")} style={iconBtnStyle}><ArrowLeft size={16} /></button>
        <Avatar name={staffMember.name} color={staffMember.color} size={42} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 className="bt-display" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{staffMember.name}</h1>
            <Badge color={staffMember.role === "admin" ? COLORS.accent : COLORS.info}>{staffMember.role}</Badge>
            <StatusBadge status={staffMember.status} />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textFaint }}>@{staffMember.username} · {pages.length} pages assigned</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatChip label="Total Spend" value={`$${fmt(allTimeMetrics.spend, 0)}`} accent={COLORS.accent} />
        <StatChip label="Conversions" value={fmt(allTimeMetrics.conversions, 0)} accent={COLORS.good} />
        <StatChip label="Cost/Conv" value={fmtMoney(allTimeMetrics.cpconv)} />
        <StatChip label="Accounts" value={fmt(allTimeMetrics.accountsCreated, 0)} accent={COLORS.info} />
        <StatChip label="Conv Rate" value={fmtPctMetric(allTimeMetrics.convRate)} />
        <StatChip label="Pages" value={String(pages.length)} />
      </div>

      {/* Monthly chart */}
      {monthlyData.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 10 }}>Monthly Spend (last 6 months)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData}>
              <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${fmt(v, 0)}`, "Spend"]} />
              <Bar dataKey="spend" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Page performance */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          Assigned Pages
        </div>
        {pageRows.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: COLORS.textFaint, fontSize: 13 }}>No pages assigned</div>
        ) : (
          <SortableTable
            columns={[
              { key: "name", label: "Page", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                </div>
              )},
              { key: "platform", label: "Platform", render: (r) => <span style={{ fontSize: 12, color: COLORS.textFaint }}>{r.platform}</span> },
              { key: "spend", label: "Spend", align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
              { key: "conversions", label: "Conv.", align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} highlight={COLORS.good} /> },
              { key: "cpconv", label: "Cost/Conv", align: "right", sortVal: (r) => r.cpconv ?? Infinity, render: (r) => <MetricValue value={r.cpconv} prefix="$" /> },
              { key: "convRate", label: "Conv Rate", align: "right", render: (r) => <MetricValue value={r.convRate} suffix="%" decimals={1} /> },
            ]}
            rows={pageRows}
            onRowClick={(r) => navigate(`/pages/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
