/**
 * AdDataProvider abstraction
 * Designed to support future platforms: Meta Ads, Google Ads, TikTok Ads, etc.
 * For now: ManualProvider (no-op) and MetaAdsProvider (existing Facebook API).
 */

// ── Base interface ─────────────────────────────────────────────────────────
export class AdDataProvider {
  get name() { return "unknown"; }

  // eslint-disable-next-line no-unused-vars
  async fetchInsights({ accountId, campaignFilter, startDate, endDate, accessToken }) {
    return {
      spend: 0, impressions: 0, reach: 0, clicks: 0,
    };
  }
}

// ── Manual provider (no-op — user enters all data manually) ───────────────
export class ManualProvider extends AdDataProvider {
  get name() { return "manual"; }
  async fetchInsights() { return null; }
}

// ── Meta Ads provider (Facebook Graph API) ─────────────────────────────────
export class MetaAdsProvider extends AdDataProvider {
  get name() { return "meta"; }

  async fetchInsights({ accountId, campaignFilter, startDate, endDate, accessToken }) {
    if (!accessToken?.trim()) throw new Error("No Facebook Access Token configured");
    if (!accountId?.trim()) throw new Error("No Ad Account ID configured for this page");

    let actId = accountId.trim();
    if (!actId.startsWith("act_")) actId = `act_${actId}`;

    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    let url = `https://graph.facebook.com/v19.0/${actId}/insights` +
      `?access_token=${encodeURIComponent(accessToken.trim())}` +
      `&time_range=${encodeURIComponent(timeRange)}` +
      `&fields=spend,impressions,clicks,reach`;

    if (campaignFilter?.trim()) {
      const filtering = JSON.stringify([{
        field: "campaign.name", operator: "CONTAIN", value: campaignFilter.trim(),
      }]);
      url += `&filtering=${encodeURIComponent(filtering)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(`Facebook API: ${data.error.message || "Failed to fetch data"}`);

    if (data.data && data.data.length > 0) {
      return data.data.reduce((acc, row) => ({
        spend: acc.spend + (Number(row.spend) || 0),
        impressions: acc.impressions + (Number(row.impressions) || 0),
        reach: acc.reach + (Number(row.reach) || 0),
        clicks: acc.clicks + (Number(row.clicks) || 0),
      }), { spend: 0, impressions: 0, reach: 0, clicks: 0 });
    }

    return { spend: 0, impressions: 0, reach: 0, clicks: 0 };
  }
}

export const testAccessToken = async (accessToken) => {
  if (!accessToken?.trim()) throw new Error("No token provided");
  const url = `https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(accessToken.trim())}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Invalid or expired token");
  return data;
};

// Factory
export const createProvider = (type = "manual", opts = {}) => {
  switch (type) {
    case "meta": return new MetaAdsProvider(opts);
    default: return new ManualProvider();
  }
};
