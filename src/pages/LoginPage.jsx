import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Eye, EyeOff, Languages } from "lucide-react";
import { COLORS, FONTS, inputStyle, primaryBtnStyle } from "../lib/colors.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useLang } from "../hooks/useLang.jsx";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export default function LoginPage() {
  const { user, login, bootstrap } = useAuth();
  const { lang, toggleLang, T } = useLang();
  const navigate = useNavigate();
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) { navigate("/dashboard", { replace: true }); return; }
    // Check Firestore for first-run (no users yet)
    // If permission-denied, it means rules are blocking unauthenticated access
    // In that case, we try the bootstrap approach — Firestore rules will reject
    // duplicate admin creation so it's safe to show the setup form
    getDocs(query(collection(db, "users"), limit(1))).then((snap) => {
      setIsFirstRun(snap.empty);
    }).catch((err) => {
      // permission-denied = rules active, but we don't know if users exist
      // Show setup form — bootstrap() will reject if admin already exists
      if (err.code === "permission-denied") setIsFirstRun(true);
      else setIsFirstRun(false);
    });
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) navigate("/dashboard", { replace: true });
    else setError(result.error);
  };

  const handleBootstrap = async (e) => {
    e.preventDefault();
    setError("");
    if (!adminName.trim()) { setError("Please enter your name"); return; }
    if (adminPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (adminPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const result = await bootstrap(adminName.trim(), adminPassword);
      if (result && result.success) navigate("/dashboard", { replace: true });
      else setError("Setup failed — please refresh and try again");
    } catch (err) {
      setError(err.message || "Setup failed");
    }
    setLoading(false);
  };

  return (
    <div className="bt-root" style={{
      minHeight: "100vh",
      background: `radial-gradient(900px 500px at 50% -100px, #E8B24D18, transparent), ${COLORS.bg}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <style>{FONTS}</style>

      <div className="bt-fade" style={{
        width: "100%", maxWidth: 400,
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: "32px 28px",
        boxShadow: "0 20px 60px -20px #000000AA",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 12px",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.bad})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 8px 24px -8px ${COLORS.accent}88`,
          }}>
            <Flame size={24} color="#0B0D13" />
          </div>
          <div className="bt-display" style={{ fontSize: 22, fontWeight: 700 }}>Boost Ops</div>
          <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4 }}>
            {isFirstRun ? T("setup_admin") : T("sign_in")}
          </div>
        </div>

        {/* Language toggle on login page */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button onClick={toggleLang} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
            borderRadius: 20, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
            border: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt, color: COLORS.textSecondary,
          }}>
            <Languages size={13} />
            {lang === "km" ? (
              <><span style={{ color: COLORS.accent }}>ខ្មែរ</span><span> / EN</span></>
            ) : (
              <><span>KM / </span><span style={{ color: COLORS.accent }}>English</span></>
            )}
          </button>
        </div>

        {isFirstRun ? (
          <form onSubmit={handleBootstrap} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 5 }}>{T("your_name")}</div>
              <input
                value={adminName} onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Admin"
                style={inputStyle} autoFocus
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 5 }}>{T("password")}</div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer",
                }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 5 }}>{T("confirm_password")}</div>
              <input
                type="password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>
            {error && <div style={{ fontSize: 12.5, color: COLORS.bad, background: `${COLORS.bad}15`, border: `1px solid ${COLORS.bad}44`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
            <button type="submit" style={{ ...primaryBtnStyle, justifyContent: "center", marginTop: 4 }}>
              {T("create_admin")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 5 }}>{T("username")}</div>
              <input
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputStyle} autoFocus autoComplete="username"
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 5 }}>{T("password")}</div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer",
                }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <div style={{ fontSize: 12.5, color: COLORS.bad, background: `${COLORS.bad}15`, border: `1px solid ${COLORS.bad}44`, borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              ...primaryBtnStyle, justifyContent: "center", marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? T("signing_in") : T("sign_in_btn")}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, padding: "12px", background: COLORS.surfaceAlt, borderRadius: 8, fontSize: 11, color: COLORS.textFaint, lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.textSecondary }}>Demo tip:</strong> After setup, default staff password is "password123". Change it in Settings.
        </div>
      </div>
    </div>
  );
}
