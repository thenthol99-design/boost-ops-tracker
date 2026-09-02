import React, { useState } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { COLORS, primaryBtnStyle, inputStyle, iconBtnStyle } from "../lib/colors.js";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { testAccessToken } from "../lib/adDataProvider.js";
import { fmtDate } from "../lib/helpers.js";
import { Toast, Card, Field, ConfirmDialog } from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";
import { changeOwnPassword } from "../lib/auth.js";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export default function SettingsPage() {
  const { data, addFbToken, deleteFbToken, saveFbToken, migrateFromLocalStorage } = useData();
  const { user, logout } = useAuth();
  const [toast, showToast] = useToast();
  const [migrating, setMigrating] = useState(false);

  // FB Token
  const [newTokenName, setNewTokenName] = useState("");
  const [newToken, setNewToken] = useState("");
  const [testingToken, setTestingToken] = useState(null);
  const [testResult, setTestResult] = useState({});
  const [showToken, setShowToken] = useState({});
  const [confirmDeleteToken, setConfirmDeleteToken] = useState(null);

  // Change own password
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const isAdmin = user?.role === "admin";

  const handleTestToken = async (tokenId, token) => {
    setTestingToken(tokenId);
    setTestResult((prev) => ({ ...prev, [tokenId]: null }));
    try {
      const result = await testAccessToken(token);
      setTestResult((prev) => ({ ...prev, [tokenId]: { ok: true, name: result.name } }));
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [tokenId]: { ok: false, error: err.message } }));
    }
    setTestingToken(null);
  };

  const handleAddToken = async () => {
    if (!newTokenName.trim() || !newToken.trim()) return;
    await addFbToken(newTokenName.trim(), newToken.trim());
    showToast("Success: Token added");
    setNewTokenName(""); setNewToken("");
  };

  const handleSaveLegacyToken = async () => {
    await saveFbToken(newToken.trim());
    showToast("Success: Default token saved");
  };

  const handleChangePassword = async () => {
    if (!oldPass) { showToast("Error: Enter your current password"); return; }
    if (!newPass || newPass.length < 6) { showToast("Error: Password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { showToast("Error: Passwords do not match"); return; }
    try {
      await changeOwnPassword(oldPass, newPass);
      await updateDoc(doc(db, "users", user.id), { password: btoa(newPass) });
      showToast("Success: Password changed");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      showToast("Error: " + (err.message || "Failed to change password"));
    }
  };

  const handleMigrateLocalStorage = async () => {
    setMigrating(true);
    try {
      const result = await migrateFromLocalStorage();
      if (result.migrated) {
        showToast(`Success: Migrated ${result.counts.pages} pages, ${result.counts.entries} entries, ${result.counts.campaigns} campaigns`);
      } else {
        showToast("Info: " + result.reason);
      }
    } catch (err) {
      showToast("Error: " + err.message);
    }
    setMigrating(false);
  };

  return (
    <div className="bt-fade">
      <Toast toast={toast} />
      {confirmDeleteToken && (
        <ConfirmDialog
          message="Delete this access token? Any pages using it will fall back to the default token."
          onConfirm={() => { deleteFbToken(confirmDeleteToken); showToast("Token deleted"); setConfirmDeleteToken(null); }}
          onCancel={() => setConfirmDeleteToken(null)}
        />
      )}

      <PageHeader title="Settings" sub="API tokens, account settings, and preferences" />

      {/* Facebook Access Tokens */}
      {isAdmin && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Key size={16} style={{ color: COLORS.accent }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>Facebook / Meta Ads Tokens</div>
          </div>

          {/* Existing tokens */}
          {data.fbTokens?.map((t) => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`,
              borderRadius: 8, marginBottom: 8,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                <div className="bt-mono" style={{ fontSize: 11, color: COLORS.textFaint, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {showToken[t.id] ? t.token : t.token.slice(0, 20) + "●●●●●●"}
                </div>
                {testResult[t.id] && (
                  <div style={{ fontSize: 11, marginTop: 3, color: testResult[t.id].ok ? COLORS.good : COLORS.bad }}>
                    {testResult[t.id].ok ? `✓ Valid — ${testResult[t.id].name}` : `✕ ${testResult[t.id].error}`}
                  </div>
                )}
              </div>
              <button onClick={() => setShowToken((p) => ({ ...p, [t.id]: !p[t.id] }))} style={{ ...iconBtnStyle, width: 28, height: 28 }}>
                {showToken[t.id] ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button onClick={() => handleTestToken(t.id, t.token)} disabled={testingToken === t.id}
                style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11.5, cursor: "pointer", border: `1px solid ${COLORS.good}44`, background: `${COLORS.good}14`, color: COLORS.good }}>
                {testingToken === t.id ? <Loader2 size={11} className="bt-spin" /> : "Test"}
              </button>
              <button onClick={() => setConfirmDeleteToken(t.id)} style={{ ...iconBtnStyle, width: 28, height: 28, color: COLORS.bad }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add new token */}
          <div style={{ marginTop: 10, background: COLORS.surfaceAlt, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10, color: COLORS.textSecondary }}>Add New Token</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} placeholder="Token name (e.g. Page 01 Token)" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="Paste access token here..." style={{ ...inputStyle, flex: 1 }} type="password" />
              <button onClick={handleAddToken} disabled={!newTokenName.trim() || !newToken.trim()} style={{
                ...primaryBtnStyle, opacity: (newTokenName.trim() && newToken.trim()) ? 1 : 0.5,
              }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Account settings */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Account Settings</div>
        <div style={{ padding: "10px 12px", background: COLORS.surfaceAlt, borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginBottom: 3 }}>Logged in as</div>
          <div style={{ fontWeight: 600 }}>{user?.name} <span style={{ fontSize: 12, color: COLORS.textFaint }}>(@{user?.username})</span></div>
          <div style={{ fontSize: 12, color: COLORS.textFaint, textTransform: "capitalize" }}>{user?.role}</div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Change Password</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Field label="Current Password">
            <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Current password" style={inputStyle} />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 6 characters" style={inputStyle} />
          </Field>
          <Field label="Confirm Password">
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repeat password" style={inputStyle} />
          </Field>
          <button onClick={handleChangePassword} disabled={!oldPass || !newPass || !confirmPass} style={{
            ...primaryBtnStyle, opacity: (oldPass && newPass && confirmPass) ? 1 : 0.5,
            alignSelf: "flex-start",
          }}>
            Save Password
          </button>
        </div>
      </Card>

      {/* Data Migration */}
      {localStorage.getItem("boost-tracker-data-v3") && (
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📦 Migrate Old Data</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
            Found data from the old version (localStorage). Click to migrate it to the cloud database.
          </div>
          <button
            onClick={handleMigrateLocalStorage}
            disabled={migrating}
            style={{ ...primaryBtnStyle, background: "#22c55e", alignSelf: "flex-start" }}
          >
            {migrating ? "Migrating..." : "🚀 Migrate to Cloud"}
          </button>
        </Card>
      )}
    </div>
  );
}
