import { signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, toEmail, AUTH_REST, API_KEY } from "./firebase.js";

// ── Session (backed by Firebase Auth — no manual sessionStorage needed) ──────
export const getSession = () => null; // deprecated — use onAuthStateChanged
export const setSession = () => {};   // deprecated
export const clearSession = () => {}; // deprecated

// ── Email helper ───────────────────────────────────────────────────────────
export const hashPassword = (plain) => btoa(plain);
export const verifyPassword = (plain, hash) => btoa(plain) === hash;

// ── Login — username + password → Firebase Auth ────────────────────────────
export const login = async (username, password) => {
  try {
    const email = toEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err) {
    const code = err.code || "";
    if (code.includes("user-not-found") || code.includes("invalid-credential") || code.includes("wrong-password")) {
      return { success: false, error: "Invalid username or password" };
    }
    if (code.includes("too-many-requests")) {
      return { success: false, error: "Too many attempts. Try again later." };
    }
    return { success: false, error: err.message };
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────
export const logout = () => signOut(auth);

// ── Create a Firebase Auth account without changing current session ─────────
// Uses the REST API so the admin session is preserved.
export const createAuthUser = async (username, password) => {
  const email = toEmail(username);
  const res = await fetch(`${AUTH_REST}:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to create auth user");
  return { uid: data.localId, email };
};

// ── Change another user's password (admin) via REST API ─────────────────────
// Signs in as the user temporarily, changes password, then restores admin session.
export const resetAuthUserPassword = async (username, currentPassword, newPassword) => {
  const email = toEmail(username);
  // Sign in as the target user via REST to get their idToken
  const res = await fetch(`${AUTH_REST}:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: currentPassword, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Could not authenticate user");

  // Update password via REST using their idToken
  const res2 = await fetch(`${AUTH_REST}:update?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: data.idToken, password: newPassword, returnSecureToken: false }),
  });
  const data2 = await res2.json();
  if (!res2.ok) throw new Error(data2.error?.message || "Failed to update password");
  return true;
};

// ── Delete a Firebase Auth account via REST (admin) ─────────────────────────
export const deleteAuthUser = async (username, password) => {
  const email = toEmail(username);
  const res = await fetch(`${AUTH_REST}:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) return; // account may not exist — ignore

  await fetch(`${AUTH_REST}:delete?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: data.idToken }),
  });
};

// ── Change own password (staff settings page) ───────────────────────────────
export const changeOwnPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
};

// ── Bootstrap first admin ───────────────────────────────────────────────────
// Uses createUserWithEmailAndPassword so the new admin is immediately signed in,
// allowing the subsequent Firestore setDoc to succeed under auth rules.
export const bootstrapAdmin = async (name, password) => {
  const username = name.toLowerCase().replace(/\s+/g, ".");
  const email = toEmail(username);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return { uid: cred.user.uid, username };
};

// ── Permission checks (unchanged) ──────────────────────────────────────────
export const can = (user, action, context = {}) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  switch (action) {
    case "view_page":
    case "enter_data":
      return context.pageStaffAssignments?.some(
        (a) => a.pageId === context.pageId && a.staffId === user.id && a.endDate === null
      ) || false;
    case "view_report":
    case "export":
    case "view_dashboard":
      return true;
    default:
      return false;
  }
};

// ── Get pages visible to user (unchanged) ───────────────────────────────────
export const getVisiblePageIds = (user, pageStaffAssignments) => {
  if (!user) return [];
  if (user.role === "admin") return null;
  return pageStaffAssignments
    .filter((a) => a.staffId === user.id && a.endDate === null)
    .map((a) => a.pageId);
};
