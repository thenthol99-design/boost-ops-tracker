import React, { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { exportCSV, parseCSVImport, loadData } from "../lib/storage.js";
import { Toast, Card, Field } from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

export default function ImportExportPage() {
  const { data, addEntry, restoreData } = useData();
  const { user } = useAuth();
  const [toast, showToast] = useToast();
  const csvRef = useRef(null);
  const backupRef = useRef(null);

  // CSV Import state
  const [importRows, setImportRows] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const handleExportCSV = () => {
    exportCSV(data.entries, data.pages, data.staff, data.campaigns);
    showToast("Success: CSV exported");
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boost-ops-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Success: Backup exported");
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { rows, errors } = parseCSVImport(text, data.pages, data.staff);
      setImportRows(rows);
      setImportErrors(errors);
      setImportConfirmed(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      await Promise.all(importRows.map((fields) => addEntry(fields)));
      showToast(`Success: Imported ${importRows.length} entries`);
      setImportRows(null);
      setImportErrors([]);
      setImportConfirmed(false);
    } catch (err) {
      showToast("Error importing data: " + err.message);
    }
    setImportLoading(false);
  };

  const handleBackupRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        restoreData(imported);
        showToast("Success: Backup restored — please refresh");
      } catch {
        showToast("Error: Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      <PageHeader title="Import / Export" sub="Export reports, import CSV data, backup and restore" />

      {/* Export */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.good}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Download size={18} style={{ color: COLORS.good }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Export CSV</div>
              <div style={{ fontSize: 12, color: COLORS.textFaint }}>All performance data</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 1.7 }}>
            Export all entries including calculated metrics. Includes: Date, Page, Staff, Spend, Impressions, Clicks, Visitors, Leads, Accounts, Conversions, Cost/Account, Cost/Conversion, Conv Rate%, CTR%, Revenue, Notes.
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.textFaint, marginBottom: 12 }}>
            Total entries: {data.entries.length}
          </div>
          <button onClick={handleExportCSV} style={{ ...primaryBtnStyle, width: "100%", justifyContent: "center" }}>
            <Download size={14} /> Download CSV
          </button>
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.accent}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={18} style={{ color: COLORS.accent }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Backup / Restore</div>
              <div style={{ fontSize: 12, color: COLORS.textFaint }}>Full JSON backup</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 1.7 }}>
            Export a complete JSON backup of all data (pages, staff, campaigns, entries, settings). Use this to migrate between devices or restore after issues.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleExportBackup} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
              border: `1px solid ${COLORS.accent}55`, background: `${COLORS.accent}14`, color: COLORS.accent, fontWeight: 600,
            }}><Download size={13} /> Export</button>
            <button onClick={() => backupRef.current?.click()} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
              border: `1px solid ${COLORS.info}55`, background: `${COLORS.info}14`, color: COLORS.info, fontWeight: 600,
            }}><Upload size={13} /> Restore</button>
          </div>
          <input ref={backupRef} type="file" accept=".json" onChange={handleBackupRestore} style={{ display: "none" }} />
        </Card>
      </div>

      {/* CSV Import */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.info}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Upload size={18} style={{ color: COLORS.info }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Import CSV</div>
            <div style={{ fontSize: 12, color: COLORS.textFaint }}>Import performance data from a spreadsheet</div>
          </div>
        </div>

        {/* Template */}
        <div style={{
          background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`, borderRadius: 8,
          padding: "10px 12px", marginBottom: 14, fontFamily: "monospace", fontSize: 11.5, color: COLORS.textSecondary,
          overflowX: "auto",
        }}>
          Required columns: <span style={{ color: COLORS.accent }}>Date</span>, <span style={{ color: COLORS.accent }}>Page</span>, <span style={{ color: COLORS.accent }}>Spend</span>
          <br />Optional: Staff, Campaign, Impressions, Reach, Clicks, Visitors, Leads, Accounts Created, Conversions, Revenue, Notes
          <br /><br />
          <strong style={{ color: COLORS.textPrimary }}>Example:</strong><br />
          Date,Page,Staff,Spend,Impressions,Clicks,Visitors,Leads,Accounts Created,Conversions<br />
          2026-09-01,Page 01,Sokha,150.00,8000,320,45,18,6,3
        </div>

        <input ref={csvRef} type="file" accept=".csv,.txt" onChange={handleCSVFile} style={{ display: "none" }} />
        <button onClick={() => csvRef.current?.click()} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          border: `2px dashed ${COLORS.border}`, background: "transparent", color: COLORS.textSecondary,
          marginBottom: 14,
        }}>
          <Upload size={16} /> Click to select a CSV file to import
        </button>

        {importErrors.length > 0 && (
          <div style={{ background: `${COLORS.bad}14`, border: `1px solid ${COLORS.bad}44`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <AlertTriangle size={14} style={{ color: COLORS.bad }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.bad }}>{importErrors.length} issue(s) found</span>
            </div>
            {importErrors.map((err, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.bad, marginTop: 2 }}>• {err}</div>
            ))}
          </div>
        )}

        {importRows && importRows.length > 0 && (
          <div style={{ background: `${COLORS.good}0D`, border: `1px solid ${COLORS.good}33`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <CheckCircle2 size={14} style={{ color: COLORS.good }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.good }}>{importRows.length} valid rows ready to import</span>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }} className="bt-scrollbar">
              {importRows.slice(0, 20).map((r, i) => {
                const page = data.pages.find((p) => p.id === r.pageId);
                return (
                  <div key={i} style={{ fontSize: 12, color: COLORS.textSecondary, padding: "2px 0" }}>
                    {r.date} · <strong>{page?.name}</strong> · ${r.boost} · {r.conversions} conv
                  </div>
                );
              })}
              {importRows.length > 20 && <div style={{ fontSize: 11, color: COLORS.textFaint }}>...and {importRows.length - 20} more rows</div>}
            </div>
            <button onClick={handleConfirmImport} disabled={importLoading} style={{
              ...primaryBtnStyle, marginTop: 10, width: "100%", justifyContent: "center",
            }}>
              <CheckCircle2 size={14} /> Confirm Import All {importRows.length} Rows
            </button>
          </div>
        )}

        {importRows?.length === 0 && importErrors.length === 0 && (
          <div style={{ color: COLORS.textFaint, fontSize: 12.5, textAlign: "center" }}>No valid data found in file.</div>
        )}
      </Card>
    </div>
  );
}
