import { uid } from "./helpers.js";

const STORAGE_KEY = "boost-tracker-data-v3";
const V2_KEY = "boost-tracker-data-v2";

// ── Default structure ──────────────────────────────────────────────────────
const defaultData = () => ({
  version: 3,
  staff: [],
  pages: [],
  pageStaffAssignments: [],
  campaigns: [],
  entries: [],
  auditLog: [],
  fbAccessToken: "",
  fbTokens: [],
  currentUser: null,
});

// ── Migrate v2 → v3 ───────────────────────────────────────────────────────
const migrateV2 = (v2) => {
  const data = defaultData();

  // Migrate staff — add role/status/username
  data.staff = (v2.staff || []).map((s, i) => ({
    ...s,
    username: s.username || s.name.toLowerCase().replace(/\s+/g, "."),
    role: i === 0 ? "admin" : "staff",
    status: "active",
    password: s.password || btoa("password123"),
    createdAt: s.createdAt || Date.now(),
    lastLogin: null,
  }));

  // Migrate pages — add platform/status/notes
  data.pages = (v2.pages || []).map((p) => ({
    ...p,
    platform: p.platform || "Facebook",
    status: p.status || "active",
    notes: p.notes || "",
    createdAt: p.createdAt || Date.now(),
  }));

  // Build assignment history from current page.staffId
  data.pageStaffAssignments = data.pages
    .filter((p) => p.staffId)
    .map((p) => ({
      id: uid(),
      pageId: p.id,
      staffId: p.staffId,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      changedBy: "migration",
      createdAt: Date.now(),
    }));

  // Migrate entries — add new v3 fields
  data.entries = (v2.entries || []).map((e) => ({
    ...e,
    date: e.date || e.startDate,
    campaignId: e.campaignId || null,
    staffId: e.staffId || null,
    impressions: Number(e.impressions || 0),
    reach: Number(e.reach || 0),
    clicks: Number(e.clicks || 0),
    visitors: Number(e.visitors || 0),
    leads: Number(e.leads || 0),
    accountsCreated: Number(e.accountsCreated || 0),
    // Map existing "depositors" to conversions
    conversions: Number(e.depositors || 0),
    revenue: null,
    updatedAt: e.updatedAt || null,
    createdBy: e.createdBy || null,
    updatedBy: null,
  }));

  data.campaigns = [];
  data.auditLog = [];
  data.fbAccessToken = v2.fbAccessToken || "";
  data.fbTokens = v2.fbTokens || [];

  return data;
};

// ── Load ───────────────────────────────────────────────────────────────────
export const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData(), ...JSON.parse(raw) };
  } catch { /* ignore */ }

  // Try migrating from v2
  try {
    const v2raw = localStorage.getItem(V2_KEY);
    if (v2raw) {
      const migrated = migrateV2(JSON.parse(v2raw));
      saveData(migrated);
      return migrated;
    }
  } catch { /* ignore */ }

  return defaultData();
};

// ── Save ───────────────────────────────────────────────────────────────────
export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

// ── Audit log helper ───────────────────────────────────────────────────────
export const createAuditEntry = ({ userId, userName, action, entityType, entityId, oldValue, newValue }) => ({
  id: uid(),
  timestamp: Date.now(),
  userId: userId || "system",
  userName: userName || "System",
  action,
  entityType,
  entityId,
  oldValue: oldValue || null,
  newValue: newValue || null,
});

// ── CSV Export ─────────────────────────────────────────────────────────────
export const exportCSV = (entries, pages, staff, campaigns) => {
  const headers = [
    "Date", "Page", "Staff", "Campaign", "Platform",
    "Spend", "Impressions", "Reach", "Clicks",
    "Visitors", "Leads", "Accounts Created", "Conversions",
    "Cost/Account", "Cost/Conversion", "Conversion Rate%", "CTR%",
    "Revenue", "Notes"
  ];

  const rows = entries.map((e) => {
    const page = pages.find((p) => p.id === e.pageId);
    const staffMember = staff.find((s) => s.id === (e.staffId || page?.staffId));
    const campaign = campaigns.find((c) => c.id === e.campaignId);
    const dep = Number(e.conversions || e.depositors || 0);
    const accounts = Number(e.accountsCreated || 0);
    const spend = Number(e.boost || e.spend || 0);
    const cpa = accounts > 0 ? (spend / accounts).toFixed(2) : "";
    const cpconv = dep > 0 ? (spend / dep).toFixed(2) : "";
    const convRate = accounts > 0 ? ((dep / accounts) * 100).toFixed(1) : "";
    const ctrVal = Number(e.impressions || 0) > 0 ? ((Number(e.clicks || 0) / Number(e.impressions)) * 100).toFixed(2) : "";

    return [
      e.date || e.startDate,
      page?.name || "",
      staffMember?.name || "",
      campaign?.name || "",
      page?.platform || "",
      spend,
      e.impressions || 0,
      e.reach || 0,
      e.clicks || 0,
      e.visitors || 0,
      e.leads || 0,
      accounts,
      dep,
      cpa, cpconv, convRate, ctrVal,
      e.revenue || "",
      (e.note || "").replace(/,/g, ";"),
    ];
  });

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `performance-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── CSV Import ─────────────────────────────────────────────────────────────
export const parseCSVImport = (text, pages, staff) => {
  const lines = text.trim().split("\n").map((l) => l.replace(/\r/g, ""));
  if (lines.length < 2) return { rows: [], errors: ["File appears empty"] };

  const header = lines[0].toLowerCase().split(",").map((h) => h.replace(/"/g, "").trim());
  const get = (row, ...names) => {
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0) return row[idx]?.replace(/"/g, "").trim() || "";
    }
    return "";
  };

  const errors = [];
  const rows = [];

  lines.slice(1).forEach((line, i) => {
    const rowNum = i + 2;
    if (!line.trim()) return;
    const cols = line.split(",");

    const dateVal = get(cols, "date");
    const pageName = get(cols, "page");
    const spendVal = get(cols, "spend", "boost ($)", "boost");

    if (!dateVal) { errors.push(`Row ${rowNum}: missing date`); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) { errors.push(`Row ${rowNum}: invalid date "${dateVal}" (use YYYY-MM-DD)`); return; }
    if (!pageName) { errors.push(`Row ${rowNum}: missing page name`); return; }

    const page = pages.find((p) => p.name.toLowerCase() === pageName.toLowerCase());
    if (!page) { errors.push(`Row ${rowNum}: page "${pageName}" not found`); return; }

    const spend = parseFloat(spendVal);
    if (isNaN(spend) || spend < 0) { errors.push(`Row ${rowNum}: invalid spend "${spendVal}"`); return; }

    const staffName = get(cols, "staff");
    const staffMember = staff.find((s) => s.name.toLowerCase() === staffName.toLowerCase());

    rows.push({
      date: dateVal,
      pageId: page.id,
      staffId: staffMember?.id || page.staffId || null,
      boost: spend,
      spend,
      impressions: parseInt(get(cols, "impressions")) || 0,
      reach: parseInt(get(cols, "reach")) || 0,
      clicks: parseInt(get(cols, "clicks")) || 0,
      visitors: parseInt(get(cols, "visitors")) || 0,
      leads: parseInt(get(cols, "leads")) || 0,
      accountsCreated: parseInt(get(cols, "accounts created", "accounts")) || 0,
      conversions: parseInt(get(cols, "conversions", "depositors")) || 0,
      depositors: parseInt(get(cols, "conversions", "depositors")) || 0,
      revenue: parseFloat(get(cols, "revenue")) || null,
      note: get(cols, "notes", "note"),
      mode: "daily",
      startDate: dateVal,
      endDate: dateVal,
    });
  });

  return { rows, errors };
};
