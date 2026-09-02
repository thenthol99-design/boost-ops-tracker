import React, { useState, useEffect } from "react";
import { Link2, Loader2, CheckCircle2 } from "lucide-react";
import { COLORS, inputStyle, primaryBtnStyle } from "../lib/colors.js";
import { todayStr, fmt } from "../lib/helpers.js";
import { MetaAdsProvider } from "../lib/adDataProvider.js";
import { Field, Modal } from "./ui/index.jsx";

export default function EntryFormModal({ page, campaigns = [], accessToken, initialData, onClose, onSubmit }) {
  const isEditing = !!initialData;

  const [date, setDate] = useState(initialData?.date || initialData?.startDate || todayStr());
  const [campaignId, setCampaignId] = useState(initialData?.campaignId || "");
  const [boost, setBoost] = useState(initialData?.boost != null ? String(initialData.boost) : "");
  const [impressions, setImpressions] = useState(String(initialData?.impressions || ""));
  const [reach, setReach] = useState(String(initialData?.reach || ""));
  const [clicks, setClicks] = useState(String(initialData?.clicks || ""));
  const [visitors, setVisitors] = useState(String(initialData?.visitors || ""));
  const [leads, setLeads] = useState(String(initialData?.leads || ""));
  const [accountsCreated, setAccountsCreated] = useState(String(initialData?.accountsCreated || ""));
  const [conversions, setConversions] = useState(String(
    initialData?.conversions != null ? initialData.conversions
      : (initialData?.depositors != null ? initialData.depositors : "")
  ));
  const [revenue, setRevenue] = useState(String(initialData?.revenue || ""));
  const [note, setNote] = useState(initialData?.note || "");

  // Summary before save
  const [showSummary, setShowSummary] = useState(false);

  // Ad sync
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [synced, setSynced] = useState(false);
  const canSync = !!(page?.adAccountId && accessToken);

  const runSync = async () => {
    setSyncing(true); setSyncError(""); setSynced(false);
    try {
      const provider = new MetaAdsProvider();
      const insights = await provider.fetchInsights({
        accountId: page.adAccountId,
        campaignFilter: page.campaignFilter,
        startDate: date,
        endDate: date,
        accessToken,
      });
      if (insights) {
        setBoost(String(Math.round((insights.spend || 0) * 100) / 100));
        if (insights.impressions) setImpressions(String(insights.impressions));
        if (insights.reach) setReach(String(insights.reach));
        if (insights.clicks) setClicks(String(insights.clicks));
        setSynced(true);
      }
    } catch (err) {
      setSyncError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Calculated preview
  const spendN = Number(boost) || 0;
  const convN = Number(conversions) || 0;
  const accountsN = Number(accountsCreated) || 0;
  const visitorsN = Number(visitors) || 0;
  const leadsN = Number(leads) || 0;
  const cpa = accountsN > 0 ? spendN / accountsN : null;
  const cpconv = convN > 0 ? spendN / convN : null;
  const convRate = accountsN > 0 ? (convN / accountsN) * 100 : null;
  const ctr = Number(impressions) > 0 ? (Number(clicks) / Number(impressions)) * 100 : null;

  const handleSubmit = () => {
    const fields = {
      date, startDate: date, endDate: date, mode: "daily",
      boost: spendN, spend: spendN,
      impressions: Number(impressions) || 0,
      reach: Number(reach) || 0,
      clicks: Number(clicks) || 0,
      visitors: visitorsN,
      leads: leadsN,
      accountsCreated: accountsN,
      conversions: convN,
      depositors: convN,
      revenue: revenue ? Number(revenue) : null,
      campaignId: campaignId || null,
      note,
    };
    onSubmit(fields);
  };

  if (showSummary) {
    return (
      <Modal title="Confirm Entry" onClose={() => setShowSummary(false)} width={420}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Date", date],
              ["Page", page?.name],
              ["Spend", `$${fmt(spendN, 2)}`],
              ["Impressions", impressions || "—"],
              ["Clicks", clicks || "—"],
              ["Visitors", visitors || "—"],
              ["Leads", leads || "—"],
              ["Accounts", accountsN || "—"],
              ["Conversions", convN || "—"],
              ["Cost/Account", cpa !== null ? `$${fmt(cpa, 2)}` : "—"],
              ["Cost/Conv", cpconv !== null ? `$${fmt(cpconv, 2)}` : "—"],
              ["Conv Rate", convRate !== null ? `${fmt(convRate, 1)}%` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: COLORS.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10.5, color: COLORS.textSecondary }}>{k}</div>
                <div className="bt-mono" style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
          {note && <div style={{ fontSize: 12, color: COLORS.textFaint, fontStyle: "italic", padding: "4px 8px" }}>📝 {note}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => setShowSummary(false)} style={{
              flex: 1, padding: 10, borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary,
            }}>Edit</button>
            <button onClick={handleSubmit} style={{ flex: 2, ...primaryBtnStyle, justifyContent: "center" }}>
              <CheckCircle2 size={14} /> Confirm & Save
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={isEditing ? "Edit Entry" : `Add Entry — ${page?.name}`} onClose={onClose} width={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="bt-scrollbar">
        <Field label="Date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </Field>

        {campaigns.length > 0 && (
          <Field label="Campaign (optional)">
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} style={inputStyle}>
              <option value="">— No campaign —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        {/* Auto-sync button */}
        {canSync && (
          <div>
            <button onClick={runSync} disabled={syncing} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px", borderRadius: 8, fontSize: 12.5, cursor: syncing ? "default" : "pointer",
              border: `1px solid ${COLORS.good}55`, background: `${COLORS.good}14`,
              color: COLORS.good, fontWeight: 600,
            }}>
              {syncing ? <Loader2 size={14} className="bt-spin" /> : <Link2 size={14} />}
              {syncing ? "Syncing from Ads Manager..." : `Auto-sync spend (${page.adAccountId})`}
            </button>
            {syncError && <div style={{ fontSize: 11.5, color: COLORS.bad, marginTop: 5 }}>{syncError}</div>}
            {synced && !syncError && <div style={{ fontSize: 11.5, color: COLORS.good, marginTop: 5 }}>✓ Data synced — review before saving</div>}
          </div>
        )}

        {/* Advertising metrics */}
        <div style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, marginBottom: 10 }}>Advertising</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Spend ($)" required>
              <input type="number" inputMode="decimal" value={boost} onChange={(e) => setBoost(e.target.value)} placeholder="0.00" style={inputStyle} />
            </Field>
            <Field label="Impressions">
              <input type="number" inputMode="numeric" value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Reach">
              <input type="number" inputMode="numeric" value={reach} onChange={(e) => setReach(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Clicks">
              <input type="number" inputMode="numeric" value={clicks} onChange={(e) => setClicks(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Conversion funnel */}
        <div style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.good, marginBottom: 10 }}>Conversion Funnel</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Visitors">
              <input type="number" inputMode="numeric" value={visitors} onChange={(e) => setVisitors(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Leads">
              <input type="number" inputMode="numeric" value={leads} onChange={(e) => setLeads(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Accounts Created">
              <input type="number" inputMode="numeric" value={accountsCreated} onChange={(e) => setAccountsCreated(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
            <Field label="Conversions / Depositors">
              <input type="number" inputMode="numeric" value={conversions} onChange={(e) => setConversions(e.target.value)} placeholder="0" style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Optional */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Revenue (optional)">
            <input type="number" inputMode="decimal" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="0.00" style={inputStyle} />
          </Field>
          <div />
        </div>

        {/* Live preview */}
        {(spendN > 0 || convN > 0 || accountsN > 0) && (
          <div style={{ background: `${COLORS.good}0D`, border: `1px solid ${COLORS.good}33`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: COLORS.good, fontWeight: 600, marginBottom: 6 }}>📊 Calculated Preview</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
              {cpa !== null && <span>Cost/Account: <b className="bt-mono">${fmt(cpa, 2)}</b></span>}
              {cpconv !== null && <span>Cost/Conv: <b className="bt-mono">${fmt(cpconv, 2)}</b></span>}
              {convRate !== null && <span>Conv Rate: <b className="bt-mono">{fmt(convRate, 1)}%</b></span>}
              {ctr !== null && <span>CTR: <b className="bt-mono">{fmt(ctr, 2)}%</b></span>}
            </div>
          </div>
        )}

        <Field label="Notes (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any notes..." style={inputStyle} />
        </Field>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary,
          }}>Cancel</button>
          <button onClick={() => setShowSummary(true)} disabled={!boost} style={{
            flex: 2, ...primaryBtnStyle, justifyContent: "center", opacity: boost ? 1 : 0.5,
          }}>
            {isEditing ? "Review Changes" : "Review & Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
