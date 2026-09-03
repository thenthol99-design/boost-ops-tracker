/**
 * Calculation engine — all metrics computed here.
 * Spec §22: Always aggregate raw numbers first, then calculate ratios.
 * Never average ratios across periods.
 */

// ── Safe division ──────────────────────────────────────────────────────────
const safeDiv = (numerator, denominator) => {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
};

// Returns numeric value or null (null renders as "—" in UI)
export const costPerAccount = (spend, accounts) => safeDiv(spend, accounts);
export const costPerConversion = (spend, conversions) => safeDiv(spend, conversions);
export const conversionRate = (conversions, accounts) =>
  safeDiv(conversions, accounts) !== null ? safeDiv(conversions, accounts) * 100 : null;
export const accountRate = (accounts, visitors) =>
  safeDiv(accounts, visitors) !== null ? safeDiv(accounts, visitors) * 100 : null;
export const ctr = (clicks, impressions) =>
  safeDiv(clicks, impressions) !== null ? safeDiv(clicks, impressions) * 100 : null;
export const costPerLead = (spend, leads) => safeDiv(spend, leads);
export const costPerClick = (spend, clicks) => safeDiv(spend, clicks);

// ── Entry normalization ────────────────────────────────────────────────────
// Normalize an entry to always have a canonical "date" field
// Handles both v2 (startDate) and v3 (date) formats
export const entryDate = (e) => e.date || e.startDate || "";

// Normalize depositors: use explicit split if present, else legacy field
export const entryDepositors = (e) => {
  const explicit = (Number(e.fbDepositors || 0) + Number(e.tgDepositors || 0));
  return explicit > 0 ? explicit : Number(e.conversions || e.depositors || 0);
};

// Normalize chats/leads: use explicit split if present, else legacy field
export const entryChats = (e) => {
  const explicit = (Number(e.fbChats || 0) + Number(e.tgChats || 0));
  return explicit > 0 ? explicit : Number(e.leads || e.chats || 0);
};

// ── Raw metric aggregate from an array of entries ─────────────────────────
export const aggregateEntries = (entries) => {
  const zero = {
    spend: 0, impressions: 0, reach: 0, clicks: 0,
    visitors: 0, leads: 0, accountsCreated: 0, conversions: 0,
    revenue: 0, chats: 0, count: 0,
  };
  return entries.reduce((acc, e) => ({
    spend: acc.spend + Number(e.boost || e.spend || 0),
    impressions: acc.impressions + Number(e.impressions || 0),
    reach: acc.reach + Number(e.reach || 0),
    clicks: acc.clicks + Number(e.clicks || 0),
    visitors: acc.visitors + Number(e.visitors || 0),
    leads: acc.leads + Number(e.leads || 0),
    accountsCreated: acc.accountsCreated + Number(e.accountsCreated || 0),
    conversions: acc.conversions + entryDepositors(e),
    revenue: acc.revenue + Number(e.revenue || 0),
    chats: acc.chats + entryChats(e),
    count: acc.count + 1,
  }), zero);
};

// ── Derive all ratios from aggregated raw numbers ─────────────────────────
export const deriveMetrics = (agg) => ({
  ...agg,
  cpa: costPerAccount(agg.spend, agg.accountsCreated),
  cpconv: costPerConversion(agg.spend, agg.conversions),
  cpl: costPerLead(agg.spend, agg.leads),
  cpc: costPerClick(agg.spend, agg.clicks),
  convRate: conversionRate(agg.conversions, agg.accountsCreated),
  accountRate: accountRate(agg.accountsCreated, agg.visitors),
  ctrRate: ctr(agg.clicks, agg.impressions),
  // legacy compatibility
  costPerDepositor: costPerConversion(agg.spend, agg.conversions),
  costPerChat: costPerLead(agg.spend, agg.chats),
  depositorRate: conversionRate(agg.conversions, agg.chats),
});

// ── Filter entries by date range ───────────────────────────────────────────
export const filterByDateRange = (entries, from, to) =>
  entries.filter((e) => {
    const d = entryDate(e);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

// ── Group entries by day / week / month ────────────────────────────────────
export const groupByDay = (entries) => {
  const groups = {};
  entries.forEach((e) => {
    const key = entryDate(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, es]) => ({ date, ...deriveMetrics(aggregateEntries(es)) }));
};

export const groupByWeek = (entries) => {
  const groups = {};
  entries.forEach((e) => {
    const d = entryDate(e);
    if (!d) return;
    // Week key: Monday's date
    const base = new Date(d + "T00:00:00");
    const dow = base.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    base.setDate(base.getDate() + diff);
    const key = base.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, es]) => {
      const end = new Date(weekStart + "T00:00:00");
      end.setDate(end.getDate() + 6);
      return {
        weekStart,
        weekEnd: end.toISOString().slice(0, 10),
        label: `Week of ${weekStart}`,
        ...deriveMetrics(aggregateEntries(es)),
      };
    });
};

export const groupByMonth = (entries) => {
  const groups = {};
  entries.forEach((e) => {
    const key = entryDate(e)?.slice(0, 7);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, es]) => ({
      month,
      label: new Date(month + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      ...deriveMetrics(aggregateEntries(es)),
    }));
};

// ── Comparison (% change) between two metric sets ─────────────────────────
export const compareMetrics = (current, previous) => {
  const fields = ["spend", "conversions", "accountsCreated", "visitors", "leads", "cpa", "cpconv"];
  return fields.reduce((acc, f) => {
    const cur = current?.[f] ?? 0;
    const prev = previous?.[f] ?? 0;
    const pct = prev === 0 ? null : ((cur - prev) / prev) * 100;
    acc[f] = { current: cur, previous: prev, pctChange: pct };
    return acc;
  }, {});
};

// ── Format a nullable metric value for display ─────────────────────────────
export const fmtMetric = (val, { prefix = "", suffix = "", decimals = 2 } = {}) => {
  if (val === null || val === undefined || !isFinite(val)) return "—";
  return `${prefix}${(isFinite(val) ? val : 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
};

export const fmtMoney = (val) => fmtMetric(val, { prefix: "$", decimals: 2 });
export const fmtPctMetric = (val) => fmtMetric(val, { suffix: "%", decimals: 1 });
