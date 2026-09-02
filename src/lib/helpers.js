// ---------- id / date helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 10);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmt = (n, d = 0) =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const initials = (name) => (name || "?").trim().slice(0, 2).toUpperCase();

export const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const fmtDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Returns ISO week label "2026-W36"
export const isoWeekKey = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d - startOfWeek1;
  const weekNum = Math.floor(diff / (7 * 86400000)) + 1;
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
};

// Returns "2026-09"
export const monthKey = (dateStr) => dateStr?.slice(0, 7) || "";

// Get start of week (Monday) for a date string
export const weekStart = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

// Get end of week (Sunday)
export const weekEnd = (dateStr) => {
  const ws = weekStart(dateStr);
  const d = new Date(ws + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
};

// Named date ranges → { from, to }
export const getDateRange = (preset) => {
  const today = new Date();
  const ymd = (d) => d.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const weekStartD = new Date(today);
  const dow = today.getDay();
  weekStartD.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const lastWeekEnd = new Date(weekStartD);
  lastWeekEnd.setDate(weekStartD.getDate() - 1);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  switch (preset) {
    case "today": return { from: ymd(today), to: ymd(today) };
    case "yesterday": return { from: ymd(yesterday), to: ymd(yesterday) };
    case "this_week": return { from: ymd(weekStartD), to: ymd(today) };
    case "last_week": return { from: ymd(lastWeekStart), to: ymd(lastWeekEnd) };
    case "this_month": return { from: ymd(monthStart), to: ymd(today) };
    case "last_month": return { from: ymd(lastMonthStart), to: ymd(lastMonthEnd) };
    default: return { from: "", to: "" }; // all time
  }
};

// Percentage change (returns null if previous = 0)
export const pctChange = (current, previous) => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

export const fmtPct = (p, decimals = 1) =>
  p === null ? "—" : `${p >= 0 ? "+" : ""}${fmt(p, decimals)}%`;
