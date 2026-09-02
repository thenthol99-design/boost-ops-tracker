import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, History } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { COLORS, primaryBtnStyle, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { aggregateEntries, deriveMetrics, groupByDay, fmtMoney, fmtPctMetric } from "../lib/calculations.js";
import { fmt, fmtDate, todayStr } from "../lib/helpers.js";
import {
  Card, Toast, ConfirmDialog, StatChip, CostGauge, Badge, StatusBadge, Avatar,
  SortableTable, MetricValue, EmptyState,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";
import EntryFormModal from "../components/EntryFormModal.jsx";

export default function PageDetailPage() {
  const { id } = useParams();
  const { data, deleteEntry, updateEntry, addEntry } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast] = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [historyTab, setHistoryTab] = useState("entries"); // entries | assignment

  const page = data.pages.find((p) => p.id === id);
  if (!page) return (
    <div style={{ textAlign: "center", padding: 60, color: COLORS.textFaint }}>
      Page not found. <button onClick={() => navigate("/pages")} style={{ color: COLORS.accent, background: "none", border: "none", cursor: "pointer" }}>Back</button>
    </div>
  );

  const staff = data.staff.find((s) => s.id === page.staffId);
  const campaigns = data.campaigns.filter((c) => c.pageId === page.id);
  const entries = data.entries.filter((e) => e.pageId === page.id)
    .sort((a, b) => (b.date || b.startDate || "").localeCompare(a.date || a.startDate || ""));

  const allTimeMetrics = useMemo(() => deriveMetrics(aggregateEntries(entries)), [entries]);
  const trend = useMemo(() =>
    [...entries].sort((a, b) => (a.date || a.startDate || "").localeCompare(b.date || b.startDate || ""))
      .slice(-30)
      .map((e) => ({
        date: (e.date || e.startDate || "").slice(5),
        Spend: Number(e.boost || e.spend || 0),
        Conversions: Number(e.conversions || e.depositors || 0),
      })),
    [entries]);

  const assignments = data.pageStaffAssignments.filter((a) => a.pageId === page.id)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  const isAdmin = user?.role === "admin";
  const isAssignedStaff = page.staffId === user?.id;
  const canEdit = isAdmin || isAssignedStaff;

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {(showForm || editingEntry) && (
        <EntryFormModal
          page={page}
          campaigns={campaigns}
          accessToken={data.fbAccessToken}
          initialData={editingEntry}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          onSubmit={async (fields) => {
            try {
              if (editingEntry) { await updateEntry(editingEntry.id, fields); showToast("Entry updated"); }
              else { await addEntry({ ...fields, pageId: page.id }); showToast("Entry saved"); }
              setShowForm(false); setEditingEntry(null);
            } catch (err) { showToast(err.message || "Error saving entry", "error"); }
          }}
        />
      )}

      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("/pages")} style={{ ...iconBtnStyle }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: page.color }} />
            <h1 className="bt-display" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{page.name}</h1>
            <StatusBadge status={page.status} />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 2 }}>
            {page.platform}
            {staff && <> · <Avatar name={staff.name} color={staff.color} size={14} style={{ display: "inline-flex" }} /> {staff.name}</>}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
            <Plus size={14} /> Add Entry
          </button>
        )}
      </div>

      {/* KPI summary */}
      <Card style={{ marginBottom: 16 }}>
        <CostGauge cost={allTimeMetrics.cpconv} target={page.targetCostPerDepositor} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginTop: 14 }}>
          <StatChip label="Total Spend" value={`$${fmt(allTimeMetrics.spend, 0)}`} accent={COLORS.accent} />
          <StatChip label="Visitors" value={fmt(allTimeMetrics.visitors, 0)} />
          <StatChip label="Leads" value={fmt(allTimeMetrics.leads, 0)} />
          <StatChip label="Accounts" value={fmt(allTimeMetrics.accountsCreated, 0)} accent={COLORS.info} />
          <StatChip label="Conversions" value={fmt(allTimeMetrics.conversions, 0)} accent={COLORS.good} />
          <StatChip label="Conv Rate" value={fmtPctMetric(allTimeMetrics.convRate)} accent={COLORS.good} />
          <StatChip label="Cost/Account" value={fmtMoney(allTimeMetrics.cpa)} />
          <StatChip label="Impressions" value={fmt(allTimeMetrics.impressions, 0)} />
        </div>
      </Card>

      {/* Trend chart */}
      {trend.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 10 }}>Daily Trend — Spend vs Conversions</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend}>
              <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill: COLORS.accent, fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `$${v}`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: COLORS.good, fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="Spend" stroke={COLORS.accent} strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="Conversions" stroke={COLORS.good} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ v: "entries", l: `Entries (${entries.length})` }, { v: "assignment", l: "Assignment History" }].map((t) => (
          <button key={t.v} onClick={() => setHistoryTab(t.v)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
            border: `1px solid ${historyTab === t.v ? COLORS.accent : COLORS.border}`,
            background: historyTab === t.v ? `${COLORS.accent}1A` : COLORS.surface,
            color: historyTab === t.v ? COLORS.accent : COLORS.textSecondary, fontWeight: 600,
          }}>{t.l}</button>
        ))}
        {canEdit && (
          <button onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, marginLeft: "auto" }}>
            <Plus size={13} /> Add Entry
          </button>
        )}
      </div>

      {historyTab === "entries" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {entries.length === 0 ? (
            <EmptyState icon="📊" title="No entries yet"
              sub="Add daily performance data to start tracking."
              action={canEdit && <button onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, margin: "0 auto" }}><Plus size={13} /> Add Entry</button>}
            />
          ) : (
            <SortableTable
              columns={[
                { key: "date", label: "Date", render: (r) => <span className="bt-mono" style={{ fontSize: 12.5 }}>{r.date || r.startDate}</span> },
                { key: "boost", label: "Spend", align: "right", render: (r) => <MetricValue value={Number(r.boost || r.spend || 0)} prefix="$" /> },
                { key: "impressions", label: "Impr.", align: "right", render: (r) => <MetricValue value={r.impressions} decimals={0} /> },
                { key: "clicks", label: "Clicks", align: "right", render: (r) => <MetricValue value={r.clicks} decimals={0} /> },
                { key: "visitors", label: "Visitors", align: "right", render: (r) => <MetricValue value={r.visitors} decimals={0} /> },
                { key: "leads", label: "Leads", align: "right", render: (r) => <MetricValue value={r.leads} decimals={0} /> },
                { key: "accountsCreated", label: "Accounts", align: "right", render: (r) => <MetricValue value={r.accountsCreated} decimals={0} highlight={COLORS.info} /> },
                { key: "conversions", label: "Conv.", align: "right", render: (r) => <MetricValue value={Number(r.conversions || r.depositors || 0)} decimals={0} highlight={COLORS.good} /> },
                {
                  key: "actions", label: "", sortable: false,
                  render: (r) => canEdit ? (
                    <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEditingEntry(r)} style={{ ...iconBtnStyle, width: 26, height: 26 }}><Pencil size={12} /></button>
                      <button onClick={() => setConfirmDelete({
                        message: `Delete entry for ${r.date || r.startDate}?`,
                        onConfirm: async () => { await deleteEntry(r.id); showToast("Entry deleted"); setConfirmDelete(null); },
                      })} style={{ ...iconBtnStyle, width: 26, height: 26, color: COLORS.bad }}><Trash2 size={12} /></button>
                    </div>
                  ) : null,
                },
              ]}
              rows={entries}
            />
          )}
        </Card>
      )}

      {historyTab === "assignment" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>
            Staff Assignment History
          </div>
          {assignments.length === 0 ? (
            <div style={{ color: COLORS.textFaint, fontSize: 12.5, textAlign: "center", padding: 20 }}>No assignment history</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assignments.map((a) => {
                const s = data.staff.find((st) => st.id === a.staffId);
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    background: a.endDate === null ? `${COLORS.good}0D` : COLORS.surfaceAlt,
                    border: `1px solid ${a.endDate === null ? COLORS.good + "33" : COLORS.borderSoft}`,
                    borderRadius: 8,
                  }}>
                    {s && <Avatar name={s.name} color={s.color} size={28} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s?.name || "Unknown Staff"}</div>
                      <div style={{ fontSize: 11, color: COLORS.textFaint }}>
                        {fmtDate(a.startDate)} → {a.endDate ? fmtDate(a.endDate) : <span style={{ color: COLORS.good }}>Current</span>}
                      </div>
                    </div>
                    {a.endDate === null && <Badge color={COLORS.good}>Current</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
