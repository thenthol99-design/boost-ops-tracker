import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../hooks/useData.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useToast } from "../hooks/useToast.js";
import { getVisiblePageIds } from "../lib/auth.js";
import { Toast, Card } from "../components/ui/index.jsx";
import { PageHeader } from "../components/layout/Sidebar.jsx";
import EntryFormModal from "../components/EntryFormModal.jsx";

export default function DailyEntryPage() {
  const { data, addEntry } = useData();
  const { user } = useAuth();
  const [toast, showToast] = useToast();
  const [selectedPageId, setSelectedPageId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const visibleIds = getVisiblePageIds(user, data.pageStaffAssignments);
  const visiblePages = visibleIds !== null
    ? data.pages.filter((p) => visibleIds.includes(p.id) && p.status === "active")
    : data.pages.filter((p) => p.status === "active");

  const selectedPage = visiblePages.find((p) => p.id === selectedPageId);

  return (
    <div className="bt-fade">
      <Toast toast={toast} />

      <PageHeader title="Daily Entry" sub="Record daily performance data for a single page" />

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Select a Page</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visiblePages.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPageId(p.id); setShowForm(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: selectedPageId === p.id ? `${p.color}1A` : COLORS_BG,
                border: `1px solid ${selectedPageId === p.id ? p.color + "66" : COLORS_BORDER}`,
                color: COLORS_TEXT, transition: "background .15s, border-color .15s",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: COLORS_FAINT }}>{p.platform}</div>
              </div>
              <span style={{ fontSize: 12.5, color: COLORS_ACCENT, fontWeight: 600 }}>Enter Data →</span>
            </button>
          ))}
          {visiblePages.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: COLORS_FAINT, fontSize: 13 }}>
              No active pages available. Contact your admin.
            </div>
          )}
        </div>
      </Card>

      {showForm && selectedPage && (
        <EntryFormModal
          page={selectedPage}
          campaigns={data.campaigns.filter((c) => c.pageId === selectedPageId)}
          accessToken={data.fbAccessToken}
          onClose={() => { setShowForm(false); setSelectedPageId(""); }}
          onSubmit={async (fields) => {
            try {
              await addEntry({ ...fields, pageId: selectedPageId });
              showToast("Success: Entry saved successfully");
              setShowForm(false);
              setSelectedPageId("");
            } catch (err) { showToast(err.message || "Error saving entry", "error"); }
          }}
        />
      )}
    </div>
  );
}

const COLORS_BG = "#1F2330";
const COLORS_BORDER = "#282D3F";
const COLORS_TEXT = "#F1EFE9";
const COLORS_FAINT = "#565C78";
const COLORS_ACCENT = "#E8B24D";
