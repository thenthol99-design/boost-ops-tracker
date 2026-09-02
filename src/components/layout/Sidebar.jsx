import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Target, PenLine, Package,
  BarChart2, Download, ClipboardList, Settings, LogOut, ChevronLeft,
  ChevronRight, Flame, Languages,
} from "lucide-react";
import { COLORS } from "../../lib/colors.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useLang } from "../../hooks/useLang.jsx";
import { Avatar } from "../ui/index.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/pages",     icon: FileText,        key: "pages" },
  { to: "/staff",     icon: Users,           key: "staff",        adminOnly: true },
  { to: "/campaigns", icon: Target,          key: "campaigns" },
  { to: "/entry/daily", icon: PenLine,       key: "daily_entry" },
  { to: "/entry/bulk",  icon: Package,       key: "bulk_entry" },
  { to: "/reports",   icon: BarChart2,       key: "reports" },
  { to: "/import",    icon: Download,        key: "import_export" },
  { to: "/audit-logs",icon: ClipboardList,   key: "audit_logs",   adminOnly: true },
  { to: "/settings",  icon: Settings,        key: "settings",     adminOnly: true },
];

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink to={to} style={{ textDecoration: "none" }} end={to === "/dashboard"}>
      {({ isActive }) => (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "10px 0" : "10px 12px",
          borderRadius: 10, cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start",
          background: isActive ? `${COLORS.accent}1A` : "transparent",
          border: `1px solid ${isActive ? COLORS.accent + "44" : "transparent"}`,
          color: isActive ? COLORS.accent : COLORS.textSecondary,
          transition: "background .15s, color .15s",
        }}
          onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = COLORS.surfaceAlt)}
          onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
          title={collapsed ? label : undefined}
        >
          <Icon size={16} />
          {!collapsed && <span style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</span>}
        </div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { lang, toggleLang, T } = useLang();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((n) => !n.adminOnly || user?.role === "admin");
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside style={{
      width: collapsed ? 60 : 220, flexShrink: 0,
      background: COLORS.surface, borderRight: `1px solid ${COLORS.borderSoft}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      transition: "width .2s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "18px 0" : "18px 16px",
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        display: "flex", alignItems: "center", gap: 10,
        justifyContent: collapsed ? "center" : "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.bad})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px -4px ${COLORS.accent}66`,
          }}>
            <Flame size={16} color="#0B0D13" />
          </div>
          {!collapsed && (
            <div>
              <div className="bt-display" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap" }}>Boost Ops</div>
              <div style={{ fontSize: 9.5, color: COLORS.textFaint }}>Performance Tracker</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: "none", border: "none", color: COLORS.textFaint,
            cursor: "pointer", padding: 2,
          }}><ChevronLeft size={14} /></button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? "12px 6px" : "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visibleNav.map((n) => (
            <NavItem key={n.to} to={n.to} icon={n.icon} label={T(n.key)} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* User section */}
      <div style={{
        borderTop: `1px solid ${COLORS.borderSoft}`,
        padding: collapsed ? "12px 6px" : "12px 10px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {/* Language toggle */}
        <button onClick={toggleLang} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "8px 0" : "8px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 8, cursor: "pointer", width: "100%",
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surfaceAlt,
          color: COLORS.textSecondary, fontSize: 12.5, fontWeight: 600,
          transition: "background .15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.surfaceAlt; }}
          title={collapsed ? `Switch to ${lang === "en" ? "ភាសាខ្មែរ" : "English"}` : undefined}
        >
          <Languages size={14} />
          {!collapsed && (
            <span>
              {lang === "km" ? (
                <><span style={{ color: COLORS.accent }}>ខ្មែរ</span><span style={{ color: COLORS.textFaint }}> / EN</span></>
              ) : (
                <><span style={{ color: COLORS.textFaint }}>KM / </span><span style={{ color: COLORS.accent }}>English</span></>
              )}
            </span>
          )}
        </button>

        {!collapsed && user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
            <Avatar name={user.name} color={COLORS.accent} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: COLORS.textFaint, textTransform: "capitalize" }}>{T(user.role) || user.role}</div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "8px 0" : "8px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 8, background: "none", border: "none",
          color: COLORS.textFaint, cursor: "pointer", fontSize: 13,
          width: "100%",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.bad; e.currentTarget.style.background = `${COLORS.bad}1A`; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textFaint; e.currentTarget.style.background = "none"; }}
          title={collapsed ? T("logout") : undefined}
        >
          <LogOut size={15} />
          {!collapsed && T("logout")}
        </button>

        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "6px 0", borderRadius: 8, background: "none",
            border: `1px solid ${COLORS.border}`, color: COLORS.textFaint,
            cursor: "pointer", width: "100%",
          }}>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Mobile bottom nav ──────────────────────────────────────────────────────
export function MobileNav() {
  const { T } = useLang();

  const mobileNav = [
    { to: "/dashboard",   icon: LayoutDashboard, key: "dashboard" },
    { to: "/pages",       icon: FileText,        key: "pages" },
    { to: "/entry/daily", icon: PenLine,         key: "daily_entry" },
    { to: "/reports",     icon: BarChart2,       key: "reports" },
    { to: "/settings",    icon: Settings,        key: "settings" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: `${COLORS.surface}F8`, backdropFilter: "blur(12px)",
      borderTop: `1px solid ${COLORS.borderSoft}`,
      display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {mobileNav.map((n) => (
        <NavLink key={n.to} to={n.to} style={{ flex: 1, textDecoration: "none" }} end={n.to === "/dashboard"}>
          {({ isActive }) => (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "10px 0", gap: 4,
              color: isActive ? COLORS.accent : COLORS.textFaint,
            }}>
              <n.icon size={18} />
              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{T(n.key)}</span>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}

// ── Page header (inside content area) ─────────────────────────────────────
export function PageHeader({ title, sub, action }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: 20, flexWrap: "wrap", gap: 12,
    }}>
      <div>
        <h1 className="bt-display" style={{
          margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.textPrimary,
        }}>{title}</h1>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textSecondary }}>{sub}</p>}
      </div>
      {action && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{action}</div>}
    </div>
  );
}
