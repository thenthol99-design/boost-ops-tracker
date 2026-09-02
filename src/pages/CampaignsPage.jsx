import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { aggregateEntries, deriveMetrics } from "../lib/calculations.js";
import { todayStr, fmtDate } from "../lib/helpers.js";
import {
  Card, Toast, ConfirmDialog, Badge, StatusBadge, Field, Modal,
  EmptyState, SortableTable, MetricValue,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

export default function CampaignsPage() {
  const { data, addCampaign, updateCampaign, deleteCampaign } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast] = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isAdmin = user?.role === "admin";

  const campaignRows = useMemo(() => data.campaigns.map((c) => {
    const es = data.entries.filter((e) => e.campaignId === c.id);
    const m = deriveMetrics(aggregateEntries(es));
    const page = data.pages.find((p) => p.id === c.pageId);
    const staffMember = data.staff.find((s) => s.id === c.staffId);
    return { ...c, ...m, pageName: page?.name || "—", staffName: staffMember?.name || "—" };
  }), [data.campaigns, data.entries, data.pages, data.staff]);

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {(showForm || editingCampaign) && (
        <CampaignFormModal
          campaign={editingCampaign}
          pages={data.pages}
          staff={data.staff}
          onClose={() => { setShowForm(false); setEditingCampaign(null); }}
          onSave={async (fields) => {
            try {
              if (editingCampaign) { await updateCampaign(editingCampaign.id, fields); showToast("Campaign updated"); }
              else { await addCampaign(fields); showToast("Campaign created"); }
              setShowForm(false); setEditingCampaign(null);
            } catch (err) { showToast(err.message || "Error saving campaign", "error"); }
          }}
        />
      )}

      <PageHeader
        title="Campaigns"
        sub={`${data.campaigns.length} campaign${data.campaigns.length !== 1 ? "s" : ""}`}
        action={isAdmin && (
          <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
            <Plus size={14} /> New Campaign
          </button>
        )}
      />

      {campaignRows.length === 0 ? (
        <EmptyState icon="🎯" title="No campaigns yet"
          sub="Create campaigns to group and track performance data by initiative."
          action={isAdmin && <button onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, margin: "0 auto" }}><Plus size={14} /> New Campaign</button>}
        />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <SortableTable
            columns={[
              { key: "name", label: "Campaign", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
              { key: "pageName", label: "Page" },
              { key: "staffName", label: "Staff" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "startDate", label: "Start", render: (r) => <span style={{ fontSize: 12 }}>{fmtDate(r.startDate)}</span> },
              { key: "endDate", label: "End", render: (r) => <span style={{ fontSize: 12 }}>{r.endDate ? fmtDate(r.endDate) : "—"}</span> },
              { key: "spend", label: "Spend", align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
              { key: "conversions", label: "Conv.", align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} highlight={COLORS.good} /> },
              { key: "cpconv", label: "Cost/Conv", align: "right", sortVal: (r) => r.cpconv ?? Infinity, render: (r) => <MetricValue value={r.cpconv} prefix="$" /> },
              {
                key: "actions", label: "", sortable: false,
                render: (r) => isAdmin ? (
                  <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setEditingCampaign(r)} style={{ ...iconBtnStyle, width: 28, height: 28 }}><Pencil size={13} /></button>
                    <button onClick={() => setConfirmDelete({
                      message: `Delete "${r.name}"?\n\nEntries linked to this campaign will be unlinked but not deleted.`,
                      onConfirm: async () => { await deleteCampaign(r.id); showToast("Campaign deleted"); setConfirmDelete(null); },
                    })} style={{ ...iconBtnStyle, width: 28, height: 28, color: COLORS.bad }}><Trash2 size={13} /></button>
                  </div>
                ) : null,
              },
            ]}
            rows={campaignRows}
          />
        </Card>
      )}
    </div>
  );
}

function CampaignFormModal({ campaign, pages, staff, onClose, onSave }) {
  const [name, setName] = useState(campaign?.name || "");
  const [pageId, setPageId] = useState(campaign?.pageId || "");
  const [staffId, setStaffId] = useState(campaign?.staffId || "");
  const [startDate, setStartDate] = useState(campaign?.startDate || todayStr());
  const [endDate, setEndDate] = useState(campaign?.endDate || "");
  const [status, setStatus] = useState(campaign?.status || "active");
  const [notes, setNotes] = useState(campaign?.notes || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), pageId: pageId || null, staffId: staffId || null, startDate, endDate: endDate || null, status, notes: notes.trim() });
  };

  return (
    <Modal title={campaign ? "Edit Campaign" : "New Campaign"} onClose={onClose} width={460}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Campaign Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 2026 Promo" style={inputStyle} autoFocus />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Page (optional)">
            <select value={pageId} onChange={(e) => setPageId(e.target.value)} style={inputStyle}>
              <option value="">— Any page —</option>
              {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Staff (optional)">
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle}>
              <option value="">— Any staff —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Start Date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End Date (optional)">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="ended">Ended</option>
          </select>
        </Field>
        <Field label="Notes (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, height: 70, resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 2, ...primaryBtnStyle, justifyContent: "center", opacity: name.trim() ? 1 : 0.5 }}>{campaign ? "Save Changes" : "Create Campaign"}</button>
        </div>
      </div>
    </Modal>
  );
}
