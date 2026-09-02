import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { DataProvider } from "./hooks/useData.jsx";
import { LangProvider } from "./hooks/useLang.jsx";
import { Layout } from "./components/layout/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PagesPage from "./pages/PagesPage.jsx";
import PageDetailPage from "./pages/PageDetailPage.jsx";
import StaffPage from "./pages/StaffPage.jsx";
import StaffDetailPage from "./pages/StaffDetailPage.jsx";
import CampaignsPage from "./pages/CampaignsPage.jsx";
import DailyEntryPage from "./pages/DailyEntryPage.jsx";
import BulkEntryPage from "./pages/BulkEntryPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import ImportExportPage from "./pages/ImportExportPage.jsx";
import AuditLogPage from "./pages/AuditLogPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

// ── Route guards ──────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Router ─────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DataProvider>
          <Layout />
        </DataProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "pages", element: <PagesPage /> },
      { path: "pages/:id", element: <PageDetailPage /> },
      {
        path: "staff",
        element: <RequireAdmin><StaffPage /></RequireAdmin>,
      },
      {
        path: "staff/:id",
        element: <RequireAdmin><StaffDetailPage /></RequireAdmin>,
      },
      { path: "campaigns", element: <CampaignsPage /> },
      { path: "entry/daily", element: <DailyEntryPage /> },
      { path: "entry/bulk", element: <BulkEntryPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "import", element: <ImportExportPage /> },
      {
        path: "audit-logs",
        element: <RequireAdmin><AuditLogPage /></RequireAdmin>,
      },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LangProvider>
  );
}
