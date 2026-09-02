import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, MobileNav } from "./Sidebar.jsx";
import { COLORS, FONTS } from "../../lib/colors.js";

export function Layout() {
  return (
    <div className="bt-root bt-scrollbar" style={{
      display: "flex", minHeight: "100vh",
      background: `radial-gradient(1200px 400px at 50% -80px, #E8B24D14, transparent), ${COLORS.bg}`,
      color: COLORS.textPrimary,
    }}>
      <style>{FONTS}</style>

      {/* Sidebar — hidden on mobile */}
      <div style={{ display: "flex" }} className="desktop-sidebar">
        <style>{`
          @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
          @media (min-width: 769px) { .mobile-nav-wrap { display: none !important; } }
        `}</style>
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1, minWidth: 0,
        padding: "24px 24px 96px",
        maxWidth: "calc(100% - 0px)",
        overflowX: "hidden",
      }}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-nav-wrap">
        <MobileNav />
      </div>
    </div>
  );
}
