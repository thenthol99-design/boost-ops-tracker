import React, { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { getVisiblePageIds } from "../lib/auth.js";
import { todayStr, fmt } from "../lib/helpers.js";
import { Toast, Card, Field } from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

function emptyRow(pageId) {
  return {
    pageId, boost: "", impressions: "", reach: "", clicks: "",
    visitors: "", leads: "", accountsCreated: "", conversions: "", note: "",
  };
}

export default function BulkEntryPage() {
  const { data, addEntry } = useData();
  const { user } = useAuth();
  const [toast, showToast] = useToast();
  const [date, setDate] = useState(todayStr());
  const [campaignId, setCampaignId] = useState("");
  const [rows, setRows] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [saved, setSaved] = useState(false);

  const visibleIds = getVisiblePageIds(user, data.pageStaffAssignments);
  const visiblePages = visibleIds !== null
    ? data.pages.filter((p) => visibleIds.includes(p.id) && p.status === "active")
    : data.pages.filter((p) => p.status === "active");

  const addRow = (pageId) => {
    if (rows.some((r) => r.pageId === pageId)) return;
    setRows((prev) => [...prev, emptyRow(pageId)]);
  };

  const updateRow = (pageId, field, value) => {
    setRows((prev) => prev.map((r) => r.pageId === pageId ? { ...r, [field]: value } : r));
  };

  const removeRow = (pageId) => setRows((prev) => prev.filter((r) => r.pageId !== pageId));

  const handleSaveAll = async () => {
    try {
      await Promise.all(rows.map((r) => {
        if (!r.boost && !r.conversions && !r.accountsCreated) return Promise.resolve();
        return addEntry({
          pageId: r.pageId, date, startDate: date, endDate: date, mode: "daily",
          campaignId: campaignId || null,
          boost: Number(r.boost) || 0, spend: Number(r.boost) || 0,
          impressions: Number(r.impressions) || 0,
          reach: Number(r.reach) || 0,
          clicks: Number(r.clicks) || 0,
          visitors: Number(r.visitors) || 0,
          leads: Number(r.leads) || 0,
          accountsCreated: Number(r.accountsCreated) || 0,
          conversions: Number(r.conversions) || 0,
          depositors: Number(r.conversions) || 0,
          note: r.note,
        });
      }));
      showToast(`Success: Saved ${rows.filter((r) => r.boost || r.conversions).length} entries`);
      setShowSummary(false);
      setSaved(true);
      setRows([]);
    } catch (err) {
      showToast(err.message || "Error saving entries", "error");
    }
  };

  if (saved) {
    return (
      <div className="bt-fade" style={{ textAlign: "center", padding: "60px 20px" }}>
        <CheckCircle2 size={48} style={{ color: COLORS.good, margin: "0 auto 16px" }} />
        <div className="bt-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>All entries saved!</div>
        <div style={{ color: COLORS.textSecondary, marginBottom: 20 }}>Data for {date} has been recorded.</div>
        <button onClick={() => setSaved(false)} style={{ ...primaryBtnStyle, margin: "0 auto" }}>
          <Plus size={14} /> Enter another day
        </button>
      </div>
    );
  }

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      <PageHeader title="Bulk Entry" sub="Enter performance data for multiple pages at once" />

      {/* Date & campaign */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, width: 160 }} />
          </Field>
          {data.campaigns.length > 0 && (
            <Field label="Campaign (optional)">
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
                style={{ ...inputStyle, width: 200 }}>
                <option value="">— No campaign —</option>
                {data.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      </Card>

      {/* Add pages */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Add Pages to Enter Data</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visiblePages.map((p) => {
            const added = rows.some((r) => r.pageId === p.id);
            return (
              <button key={p.id} onClick={() => added ? removeRow(p.id) : addRow(p.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 20, cursor: "pointer", fontSize: 12.5,
                border: `1px solid ${added ? p.color + "88" : COLORS.border}`,
                background: added ? `${p.color}22` : COLORS.surface,
                color: added ? p.color : COLORS.textSecondary,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
                {p.name}
                {added ? " ✓" : " +"}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Row entries */}
      {rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {rows.map((row) => {
            const page = data.pages.find((p) => p.id === row.pageId);
            const spendN = Number(row.boost) || 0;
            const convN = Number(row.conversions) || 0;
            const accountsN = Number(row.accountsCreated) || 0;
            const cpconv = convN > 0 ? spendN / convN : null;
            const cpa = accountsN > 0 ? spendN / accountsN : null;
            return (
              <Card key={row.pageId} style={{ borderLeft: `3px solid ${page.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: page.color }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{page.name}</span>
                  </div>
                  <button onClick={() => removeRow(row.pageId)} style={{
                    background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 18,
                  }}>×</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {[
                    { f: "boost", l: "Spend ($)", type: "decimal" },
                    { f: "impressions", l: "Impressions", type: "numeric" },
                    { f: "clicks", l: "Clicks", type: "numeric" },
                    { f: "visitors", l: "Visitors", type: "numeric" },
                    { f: "leads", l: "Leads", type: "numeric" },
                    { f: "accountsCreated", l: "Accounts", type: "numeric" },
                    { f: "conversions", l: "Conversions", type: "numeric" },
                  ].map(({ f, l, type }) => (
                    <div key={f}>
                      <div style={{ fontSize: 10.5, color: COLORS.textSecondary, marginBottom: 3 }}>{l}</div>
                      <input
                        type="number" inputMode={type}
                        value={row[f]} onChange={(e) => updateRow(row.pageId, f, e.target.value)}
                        placeholder="0"
                        style={{ ...inputStyle, padding: "7px 8px", fontSize: 13 }}
                      />
                    </div>
                  ))}
                </div>
                {(cpconv !== null || cpa !== null) && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: COLORS.textFaint, display: "flex", gap: 12 }}>
                    {cpconv !== null && <span>Cost/Conv: <b className="bt-mono" style={{ color: COLORS.good }}>${fmt(cpconv, 2)}</b></span>}
                    {cpa !== null && <span>Cost/Account: <b className="bt-mono">${fmt(cpa, 2)}</b></span>}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <input value={row.note} onChange={(e) => updateRow(row.pageId, "note", e.target.value)}
                    placeholder="Notes (optional)..." style={{ ...inputStyle, fontSize: 12 }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setRows([])} style={{
            flex: 1, padding: "11px", borderRadius: 10, fontSize: 13, cursor: "pointer",
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textSecondary,
          }}>Clear All</button>
          <button onClick={() => setShowSummary(true)} style={{ flex: 3, ...primaryBtnStyle, justifyContent: "center" }}>
            <CheckCircle2 size={14} /> Review & Save All ({rows.length} pages)
          </button>
        </div>
      )}

      {showSummary && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000099",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16,
        }}>
          <div className="bt-fade" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 22, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div className="bt-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Confirm Bulk Save — {date}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {rows.map((r) => {
                const page = data.pages.find((p) => p.id === r.pageId);
                return (
                  <div key={r.pageId} style={{ background: COLORS.surfaceAlt, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{page?.name}</span>
                    <span className="bt-mono" style={{ fontSize: 13 }}>
                      ${fmt(Number(r.boost), 0)} · {r.conversions || 0} conv
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowSummary(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary }}>Edit</button>
              <button onClick={handleSaveAll} style={{ flex: 2, ...primaryBtnStyle, justifyContent: "center" }}>
                <CheckCircle2 size={14} /> Confirm Save All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
