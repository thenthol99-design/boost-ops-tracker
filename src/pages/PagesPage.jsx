import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, History } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useLang } from "../hooks/useLang.jsx";
import { useToast } from "../hooks/useToast.js";
import { getVisiblePageIds } from "../lib/auth.js";
import { aggregateEntries, deriveMetrics, fmtMoney } from "../lib/calculations.js";
import { fmt, fmtDate } from "../lib/helpers.js";
import {
  Modal, Field, Avatar, Badge, StatusBadge, Card, EmptyState,
  Toast, ConfirmDialog, SortableTable, MetricValue,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

const PLATFORMS = ["Facebook", "Instagram", "TikTok", "Google", "YouTube", "Other"];

export default function PagesPage() {
  const { data, addPage, updatePage, deletePage } = useData();
  const { user } = useAuth();
  const { T } = useLang();
  const navigate = useNavigate();
  const [toast, showToast] = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const visibleIds = getVisiblePageIds(user, data.pageStaffAssignments);

  const pages = useMemo(() => {
    let ps = visibleIds !== null ? data.pages.filter((p) => visibleIds.includes(p.id)) : data.pages;
    if (search.trim()) ps = ps.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return ps;
  }, [data.pages, visibleIds, search]);

  // Compute all-time metrics per page
  const pageRows = useMemo(() => pages.map((p) => {
    const es = data.entries.filter((e) => e.pageId === p.id);
    const m = deriveMetrics(aggregateEntries(es));
    const staff = data.staff.find((s) => s.id === p.staffId);
    return { ...p, ...m, staffName: staff?.name || "—", staffColor: staff?.color };
  }), [pages, data.entries, data.staff]);

  const handleDelete = (page) => {
    setConfirmDelete({
      message: `Delete "${page.name}"?\n\nAll performance data for this page will also be deleted. This cannot be undone.`,
      onConfirm: async () => {
        await deletePage(page.id);
        showToast("Page deleted");
        setConfirmDelete(null);
      },
    });
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {(showForm || editingPage) && (
        <PageFormModal
          page={editingPage}
          staff={data.staff}
          fbTokens={data.fbTokens}
          onClose={() => { setShowForm(false); setEditingPage(null); }}
          onSave={async (fields) => {
            try {
              if (editingPage) { await updatePage(editingPage.id, fields); showToast("Page updated"); }
              else { await addPage(fields); showToast("Page added"); }
              setShowForm(false); setEditingPage(null);
            } catch (err) { showToast(err.message || "Error saving page", "error"); }
          }}
        />
      )}

      <PageHeader
        title={T("pages")}
        sub={`${pages.length} ${T("pages_count")}`}
        action={isAdmin && (
          <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
            <Plus size={14} /> {T("add_page")}
          </button>
        )}
      />

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textFaint }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages..."
          style={{ ...inputStyle, paddingLeft: 32 }} />
      </div>

      {pageRows.length === 0 ? (
        <EmptyState icon="📄" title="No pages yet"
          sub={isAdmin ? "Add your first page to start tracking performance." : "No pages assigned to you yet."}
          action={isAdmin && <button onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, margin: "0 auto" }}><Plus size={14} /> Add Page</button>}
        />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <SortableTable
            columns={[
              {
                key: "name", label: "Page",
                render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                      <div style={{ fontSize: 10.5, color: COLORS.textFaint }}>{r.platform}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "staffName", label: "Staff",
                render: (r) => r.staffColor ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={r.staffName} color={r.staffColor} size={18} />
                    <span style={{ fontSize: 12.5 }}>{r.staffName}</span>
                  </div>
                ) : <span style={{ color: COLORS.textFaint, fontSize: 12 }}>Unassigned</span>,
              },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "spend", label: "Total Spend", align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
              { key: "conversions", label: "Conversions", align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} /> },
              { key: "cpconv", label: "Cost/Conv", align: "right", sortVal: (r) => r.cpconv ?? Infinity, render: (r) => <MetricValue value={r.cpconv} prefix="$" /> },
              {
                key: "actions", label: "", sortable: false,
                render: (r) => (
                  <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/pages/${r.id}`)} style={{ ...iconBtnStyle, width: 28, height: 28 }} title="View details">
                      <History size={13} />
                    </button>
                    {isAdmin && <>
                      <button onClick={() => setEditingPage(r)} style={{ ...iconBtnStyle, width: 28, height: 28 }} title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(r)} style={{ ...iconBtnStyle, width: 28, height: 28, color: COLORS.bad }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </>}
                  </div>
                ),
              },
            ]}
            rows={pageRows}
            onRowClick={(r) => navigate(`/pages/${r.id}`)}
          />
        </Card>
      )}
    </div>
  );
}

function PageFormModal({ page, staff, fbTokens, onClose, onSave }) {
  const [name, setName] = useState(page?.name || "");
  const [platform, setPlatform] = useState(page?.platform || "Facebook");
  const [status, setStatus] = useState(page?.status || "active");
  const [staffId, setStaffId] = useState(page?.staffId || "");
  const [targetBoost, setTargetBoost] = useState(page?.targetBoost || "");
  const [targetDepositors, setTargetDepositors] = useState(page?.targetDepositors || "");
  const [targetCostPerDepositor, setTargetCostPerDepositor] = useState(page?.targetCostPerDepositor || "");
  const [adAccountId, setAdAccountId] = useState(page?.adAccountId || "");
  const [campaignFilter, setCampaignFilter] = useState(page?.campaignFilter || "");
  const [tokenId, setTokenId] = useState(page?.tokenId || "");
  const [notes, setNotes] = useState(page?.notes || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(), platform, status,
      staffId: staffId || null,
      targetBoost: Number(targetBoost) || 0,
      targetDepositors: Number(targetDepositors) || 0,
      targetCostPerDepositor: Number(targetCostPerDepositor) || 0,
      adAccountId: adAccountId.trim(),
      campaignFilter: campaignFilter.trim(),
      tokenId: tokenId.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <Modal title={page ? "Edit Page" : "Add New Page"} onClose={onClose} width={500}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Page Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Page 01" style={inputStyle} autoFocus />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Assigned Staff">
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle}>
            <option value="">— Unassigned —</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Field label="Target Spend/day ($)">
            <input type="number" value={targetBoost} onChange={(e) => setTargetBoost(e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
          <Field label="Target Conv/day">
            <input type="number" value={targetDepositors} onChange={(e) => setTargetDepositors(e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
          <Field label="Target Cost/Conv ($)">
            <input type="number" value={targetCostPerDepositor} onChange={(e) => setTargetCostPerDepositor(e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 8 }}>🔗 Ads Account (optional — for auto-sync)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Field label="Ad Account ID">
              <input value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} placeholder="act_..." style={inputStyle} />
            </Field>
            <Field label="Campaign Name Filter (optional)">
              <input value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} placeholder="e.g. PageA" style={inputStyle} />
            </Field>
            {fbTokens?.length > 0 && (
              <Field label="Facebook Access Token">
                <select value={tokenId} onChange={(e) => setTokenId(e.target.value)} style={inputStyle}>
                  <option value="">— Use Default Token —</option>
                  {fbTokens.map((t) => <option key={t.id} value={t.id}>🔑 {t.name}</option>)}
                </select>
              </Field>
            )}
          </div>
        </div>
        <Field label="Notes (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this page..."
            style={{ ...inputStyle, height: 72, resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} style={{
            flex: 2, ...primaryBtnStyle, justifyContent: "center",
            opacity: name.trim() ? 1 : 0.5,
          }}>{page ? "Save Changes" : "Add Page"}</button>
        </div>
      </div>
    </Modal>
  );
}
