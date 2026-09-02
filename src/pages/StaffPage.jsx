import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { aggregateEntries, deriveMetrics, fmtMoney } from "../lib/calculations.js";
import { fmt, fmtDate } from "../lib/helpers.js";
import {
  Card, Toast, ConfirmDialog, Avatar, StatusBadge, Badge, Field, Modal,
  EmptyState, SortableTable, MetricValue,
} from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";

export default function StaffPage() {
  const { data, addStaff, updateStaff, deactivateStaff } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast] = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  if (user?.role !== "admin") {
    return <div style={{ color: COLORS.textFaint, padding: 40, textAlign: "center" }}>Access denied.</div>;
  }

  const staffRows = useMemo(() => data.staff.map((s) => {
    const pages = data.pages.filter((p) => p.staffId === s.id);
    const entries = data.entries.filter((e) => pages.some((p) => p.id === e.pageId));
    const m = deriveMetrics(aggregateEntries(entries));
    return { ...s, pageCount: pages.length, ...m };
  }), [data.staff, data.pages, data.entries]);

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      {confirmDeactivate && <ConfirmDialog
        {...confirmDeactivate} danger={false}
        onCancel={() => setConfirmDeactivate(null)}
      />}
      {(showForm || editingStaff) && (
        <StaffFormModal
          staffMember={editingStaff}
          onClose={() => { setShowForm(false); setEditingStaff(null); }}
          onSave={async (fields) => {
            try {
              if (editingStaff) { await updateStaff(editingStaff.id, fields); showToast("Staff updated"); }
              else { await addStaff(fields); showToast("Staff member added"); }
              setShowForm(false); setEditingStaff(null);
            } catch (err) { showToast(err.message || "Error saving staff", "error"); }
          }}
        />
      )}

      <PageHeader
        title="Staff"
        sub={`${data.staff.filter((s) => s.status === "active").length} active staff members`}
        action={
          <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
            <UserPlus size={14} /> Add Staff
          </button>
        }
      />

      {staffRows.length === 0 ? (
        <EmptyState icon="👥" title="No staff members yet"
          sub="Add staff members and assign them to pages."
          action={<button onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, margin: "0 auto" }}><UserPlus size={14} /> Add Staff</button>}
        />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <SortableTable
            columns={[
              {
                key: "name", label: "Name",
                render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={r.name} color={r.color} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textFaint }}>@{r.username}</div>
                    </div>
                  </div>
                ),
              },
              { key: "role", label: "Role", render: (r) => <Badge color={r.role === "admin" ? COLORS.accent : COLORS.info}>{r.role}</Badge> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "pageCount", label: "Pages", align: "right", render: (r) => <span>{r.pageCount}</span> },
              { key: "spend", label: "Total Spend", align: "right", render: (r) => <MetricValue value={r.spend} prefix="$" decimals={0} /> },
              { key: "conversions", label: "Conv.", align: "right", render: (r) => <MetricValue value={r.conversions} decimals={0} highlight={COLORS.good} /> },
              { key: "cpconv", label: "Cost/Conv", align: "right", sortVal: (r) => r.cpconv ?? Infinity, render: (r) => <MetricValue value={r.cpconv} prefix="$" /> },
              { key: "lastLogin", label: "Last Login", render: (r) => <span style={{ fontSize: 12, color: COLORS.textFaint }}>{r.lastLogin ? fmtDate(new Date(r.lastLogin).toISOString().slice(0, 10)) : "Never"}</span> },
              {
                key: "actions", label: "", sortable: false,
                render: (r) => (
                  <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setEditingStaff(r)} style={{ ...iconBtnStyle, width: 28, height: 28 }}><Pencil size={13} /></button>
                    {r.status === "active" && r.role !== "admin" && (
                      <button onClick={() => setConfirmDeactivate({
                        message: `Deactivate ${r.name}?\n\nThey will no longer be able to log in. Historical data is preserved.`,
                        onConfirm: async () => { await deactivateStaff(r.id); showToast("Staff deactivated"); setConfirmDeactivate(null); },
                      })} style={{ ...iconBtnStyle, width: 28, height: 28, color: COLORS.bad }}><Trash2 size={13} /></button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={staffRows}
            onRowClick={(r) => navigate(`/staff/${r.id}`)}
          />
        </Card>
      )}
    </div>
  );
}

function StaffFormModal({ staffMember, onClose, onSave }) {
  const [name, setName] = useState(staffMember?.name || "");
  const [username, setUsername] = useState(staffMember?.username || "");
  const [role, setRole] = useState(staffMember?.role || "staff");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const autoUsername = name.toLowerCase().replace(/\s+/g, ".");

  const handleSave = () => {
    if (!name.trim()) return;
    const fields = {
      name: name.trim(),
      username: (username || autoUsername).trim(),
      role,
    };
    if (password) fields.password = password;
    onSave(fields);
  };

  return (
    <Modal title={staffMember ? "Edit Staff Member" : "Add Staff Member"} onClose={onClose} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Full Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sokha" style={inputStyle} autoFocus />
        </Field>
        <Field label="Username">
          <input value={username || autoUsername} onChange={(e) => setUsername(e.target.value)} placeholder={autoUsername || "username"} style={inputStyle} />
        </Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label={staffMember ? "New Password (leave blank to keep current)" : "Password"}>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={staffMember ? "Leave blank to keep" : "Min 6 characters"}
              style={{ ...inputStyle, paddingRight: 36 }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer",
            }}>
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        {!staffMember && (
          <div style={{ fontSize: 11.5, color: COLORS.textFaint, background: COLORS.surfaceAlt, padding: "8px 10px", borderRadius: 7 }}>
            Default password is "password123" if left blank. Ask staff to change it after first login.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textPrimary,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} style={{
            flex: 2, ...primaryBtnStyle, justifyContent: "center", opacity: name.trim() ? 1 : 0.5,
          }}>{staffMember ? "Save Changes" : "Add Staff"}</button>
        </div>
      </div>
    </Modal>
  );
}
