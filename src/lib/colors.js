export const COLORS = {
  bg: "#0B0D13",
  bgGlow: "radial-gradient(1200px 400px at 50% -80px, #E8B24D14, transparent)",
  surface: "#161923",
  surfaceAlt: "#1F2330",
  border: "#282D3F",
  borderSoft: "#1E2230",
  textPrimary: "#F1EFE9",
  textSecondary: "#8D93AC",
  textFaint: "#565C78",
  accent: "#E8B24D",
  good: "#33C9A4",
  bad: "#F0664A",
  info: "#5FD0F3",
  staffPalette: ["#8C9EFF", "#F0A860", "#5FD0F3", "#C77DFF", "#7DE0A0", "#F088B6"],
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.bt-root, .bt-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
.bt-display { font-family: 'Space Grotesk', sans-serif; }
.bt-mono { font-family: 'IBM Plex Mono', monospace; }
.bt-root ::selection { background: #E8B24D44; }
.bt-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.bt-scrollbar::-webkit-scrollbar-thumb { background: #282D3F; border-radius: 4px; }
.bt-fade { animation: btfade .35s cubic-bezier(.4,0,.2,1) both; }
.bt-card { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.bt-card:active { transform: scale(0.99); }
.bt-spin { animation: spin .8s linear infinite; }
@keyframes btfade { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .bt-fade, .bt-card { animation: none; transition: none; } }
input::placeholder { color: #565C78; }
select { color-scheme: dark; }
* { box-sizing: border-box; }
`;

export const cardShadow = "0 1px 0 #FFFFFF08 inset, 0 10px 28px -16px #000000AA";

export const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 8, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.borderSoft}`,
  color: COLORS.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  flexShrink: 0,
};
export const primaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
  background: COLORS.accent, color: "#12141C", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
};
export const inputStyle = {
  width: "100%", padding: "9px 10px", borderRadius: 8, background: COLORS.surfaceAlt,
  border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 13, outline: "none",
};
export const tabBtnStyle = (active) => ({
  padding: "9px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
  border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
  background: active ? "#E8B24D1F" : COLORS.surface,
  color: active ? COLORS.accent : COLORS.textSecondary, fontWeight: 600, whiteSpace: "nowrap",
});
export const staffChipStyle = (active, color) => ({
  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px 5px 8px", borderRadius: 20,
  fontSize: 12, whiteSpace: "nowrap", cursor: "pointer",
  border: `1px solid ${active ? (color || COLORS.accent) : COLORS.border}`,
  background: active ? `${color || COLORS.accent}1F` : COLORS.surface,
  color: active ? (color || COLORS.accent) : COLORS.textSecondary,
});
