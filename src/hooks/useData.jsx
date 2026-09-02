import { useState, useCallback, createContext, useContext, useEffect, useRef } from "react";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { uid, todayStr } from "../lib/helpers.js";
import { useAuth } from "./useAuth.jsx";
import { hashPassword, createAuthUser, deleteAuthUser, resetAuthUserPassword } from "../lib/auth.js";
import { COLORS } from "../lib/colors.js";
import { createAuditEntry } from "../lib/storage.js";

const DataContext = createContext(null);

// Collections
const COL = {
  users: "users",
  pages: "pages",
  entries: "entries",
  campaigns: "campaigns",
  assignments: "pageStaffAssignments",
  auditLog: "auditLog",
  settings: "settings",
};

// Convert Firestore snapshot to array with id
const snapToArr = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track which collections have loaded for the first time
  const loaded = useRef({ staff: false, pages: false, entries: false, campaigns: false, assignments: false, settings: false });
  const dataRef = useRef({
    staff: [], pages: [], entries: [], campaigns: [],
    pageStaffAssignments: [], auditLog: [],
    fbAccessToken: "", fbTokens: [],
  });

  const checkAllLoaded = useCallback(() => {
    if (Object.values(loaded.current).every(Boolean)) {
      setData({ ...dataRef.current });
      setLoading(false);
    }
  }, []);

  const updateData = useCallback((key, value) => {
    dataRef.current = { ...dataRef.current, [key]: value };
    if (loading) {
      checkAllLoaded();
    } else {
      setData({ ...dataRef.current });
    }
  }, [loading, checkAllLoaded]);

  // Subscribe to all collections
  useEffect(() => {
    const unsubs = [];

    // Staff / users
    unsubs.push(onSnapshot(collection(db, COL.users), (snap) => {
      loaded.current.staff = true;
      updateData("staff", snapToArr(snap));
    }));

    // Pages
    unsubs.push(onSnapshot(collection(db, COL.pages), (snap) => {
      loaded.current.pages = true;
      updateData("pages", snapToArr(snap));
    }));

    // Entries (ordered by date desc)
    unsubs.push(onSnapshot(query(collection(db, COL.entries), orderBy("date", "desc")), (snap) => {
      loaded.current.entries = true;
      updateData("entries", snapToArr(snap));
    }));

    // Campaigns
    unsubs.push(onSnapshot(collection(db, COL.campaigns), (snap) => {
      loaded.current.campaigns = true;
      updateData("campaigns", snapToArr(snap));
    }));

    // Page-Staff Assignments
    unsubs.push(onSnapshot(collection(db, COL.assignments), (snap) => {
      loaded.current.assignments = true;
      updateData("pageStaffAssignments", snapToArr(snap));
    }));

    // Settings
    unsubs.push(onSnapshot(doc(db, COL.settings, "global"), (snap) => {
      loaded.current.settings = true;
      const s = snap.exists() ? snap.data() : {};
      dataRef.current = {
        ...dataRef.current,
        fbAccessToken: s.fbAccessToken || "",
        fbTokens: s.fbTokens || [],
      };
      if (loading) {
        checkAllLoaded();
      } else {
        setData({ ...dataRef.current });
      }
    }));

    return () => unsubs.forEach((u) => u());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Audit helper
  const audit = useCallback(async (action, entityType, entityId, oldValue, newValue) => {
    const entry = createAuditEntry({
      userId: user?.id || "system",
      userName: user?.name || "System",
      action, entityType, entityId, oldValue, newValue,
    });
    try {
      await setDoc(doc(db, COL.auditLog, entry.id), entry);
    } catch { /* non-critical */ }
  }, [user]);

  // ── Staff CRUD ──────────────────────────────────────────────────────────
  const addStaff = useCallback(async (fields) => {
    const username = fields.username || fields.name.toLowerCase().replace(/\s+/g, ".");
    const password = fields.password || "password123";

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    // Create Firebase Auth account (doesn't change admin session)
    let firebaseUid;
    try {
      const result = await createAuthUser(username, password);
      firebaseUid = result.uid;
    } catch (err) {
      throw new Error(err.message);
    }

    const newStaff = {
      name: fields.name,
      username,
      password: hashPassword(password), // stored for admin management
      role: fields.role || "staff",
      status: "active",
      color: COLORS.staffPalette[dataRef.current.staff.length % COLORS.staffPalette.length],
      createdAt: Date.now(),
      lastLogin: null,
    };

    try {
      // Use Firebase Auth UID as Firestore document ID
      await setDoc(doc(db, COL.users, firebaseUid), newStaff);
      await audit("CREATE", "staff", firebaseUid, null, { name: newStaff.name, role: newStaff.role });
      return { id: firebaseUid, ...newStaff };
    } catch (err) {
      // Clean up orphaned auth user if firestore write failed
      try {
        await deleteAuthUser(username, password);
      } catch { /* ignore rollback failure */ }
      throw err;
    }
  }, [audit]);

  const updateStaff = useCallback(async (id, fields) => {
    const old = dataRef.current.staff.find((s) => s.id === id);
    const updates = { ...fields };

    // If password is being changed, update Firebase Auth too
    if (fields.password) {
      updates.password = hashPassword(fields.password);
      try {
        await resetAuthUserPassword(old?.username, atob(old?.password || ""), fields.password);
      } catch (err) {
        console.warn("Firebase Auth password update failed:", err.message);
        // Continue anyway — Firestore is source of truth for app logic
      }
    }

    await updateDoc(doc(db, COL.users, id), updates);
    await audit("UPDATE", "staff", id, { name: old?.name }, { name: fields.name });
  }, [audit]);

  const deactivateStaff = useCallback(async (id) => {
    await updateDoc(doc(db, COL.users, id), { status: "inactive" });
    await audit("UPDATE", "staff", id, { status: "active" }, { status: "inactive" });
  }, [audit]);

  const reactivateStaff = useCallback(async (id) => {
    await updateDoc(doc(db, COL.users, id), { status: "active" });
    await audit("UPDATE", "staff", id, { status: "inactive" }, { status: "active" });
  }, [audit]);

  const deleteStaff = useCallback(async (id) => {
    const staffMember = dataRef.current.staff.find((s) => s.id === id);
    if (!staffMember) return;

    const batch = writeBatch(db);

    // 1. Delete user from Firestore
    batch.delete(doc(db, COL.users, id));

    // 2. Unassign pages assigned to this staff
    dataRef.current.pages
      .filter((p) => p.staffId === id)
      .forEach((p) => batch.update(doc(db, COL.pages, p.id), { staffId: null }));

    // 3. Close open assignments
    dataRef.current.pageStaffAssignments
      .filter((a) => a.staffId === id && a.endDate === null)
      .forEach((a) => batch.update(doc(db, COL.assignments, a.id), { endDate: todayStr() }));

    await batch.commit();

    // 4. Try to delete from Firebase Auth via REST
    if (staffMember.username && staffMember.password) {
      try {
        const plainPassword = atob(staffMember.password);
        await deleteAuthUser(staffMember.username, plainPassword);
      } catch (err) {
        console.warn("Could not delete Auth account:", err.message);
      }
    }

    await audit("DELETE", "staff", id, { name: staffMember.name, username: staffMember.username }, null);
  }, [audit]);

  // ── Pages CRUD ──────────────────────────────────────────────────────────
  const addPage = useCallback(async (fields) => {
    const newPage = {
      name: fields.name,
      platform: fields.platform || "Facebook",
      status: "active",
      staffId: fields.staffId || null,
      color: COLORS.staffPalette[dataRef.current.pages.length % COLORS.staffPalette.length],
      targetBoost: Number(fields.targetBoost) || 0,
      targetDepositors: Number(fields.targetDepositors) || 0,
      targetCostPerDepositor: Number(fields.targetCostPerDepositor) || 0,
      adAccountId: (fields.adAccountId || "").trim(),
      campaignFilter: (fields.campaignFilter || "").trim(),
      tokenId: (fields.tokenId || "").trim(),
      notes: fields.notes || "",
      createdAt: Date.now(),
    };

    const ref = await addDoc(collection(db, COL.pages), newPage);
    const pageId = ref.id;

    if (newPage.staffId) {
      await addDoc(collection(db, COL.assignments), {
        pageId, staffId: newPage.staffId,
        startDate: todayStr(), endDate: null,
        changedBy: user?.id || "system", createdAt: Date.now(),
      });
    }

    await audit("CREATE", "page", pageId, null, { name: newPage.name });
    return { id: pageId, ...newPage };
  }, [audit, user]);

  const updatePage = useCallback(async (id, fields) => {
    const old = dataRef.current.pages.find((p) => p.id === id);
    await updateDoc(doc(db, COL.pages, id), fields);

    // Handle staff assignment change
    if (fields.staffId !== undefined && fields.staffId !== old?.staffId) {
      const batch = writeBatch(db);
      // Close old assignments
      dataRef.current.pageStaffAssignments
        .filter((a) => a.pageId === id && a.endDate === null)
        .forEach((a) => batch.update(doc(db, COL.assignments, a.id), { endDate: todayStr() }));
      // Open new assignment
      if (fields.staffId) {
        const newAssignRef = doc(collection(db, COL.assignments));
        batch.set(newAssignRef, {
          pageId: id, staffId: fields.staffId,
          startDate: todayStr(), endDate: null,
          changedBy: user?.id || "system", createdAt: Date.now(),
        });
      }
      await batch.commit();
    }

    await audit("UPDATE", "page", id, { name: old?.name }, fields);
  }, [audit, user]);

  const deletePage = useCallback(async (id) => {
    const old = dataRef.current.pages.find((p) => p.id === id);
    const batch = writeBatch(db);

    batch.delete(doc(db, COL.pages, id));

    // Delete related entries
    dataRef.current.entries
      .filter((e) => e.pageId === id)
      .forEach((e) => batch.delete(doc(db, COL.entries, e.id)));

    // Delete related assignments
    dataRef.current.pageStaffAssignments
      .filter((a) => a.pageId === id)
      .forEach((a) => batch.delete(doc(db, COL.assignments, a.id)));

    await batch.commit();
    await audit("DELETE", "page", id, { name: old?.name }, null);
  }, [audit]);

  // ── Campaigns CRUD ──────────────────────────────────────────────────────
  const addCampaign = useCallback(async (fields) => {
    const newCampaign = {
      name: fields.name, pageId: fields.pageId || null,
      staffId: fields.staffId || null, startDate: fields.startDate || todayStr(),
      endDate: fields.endDate || null, status: fields.status || "active",
      notes: fields.notes || "", createdAt: Date.now(),
    };
    const ref = await addDoc(collection(db, COL.campaigns), newCampaign);
    await audit("CREATE", "campaign", ref.id, null, { name: newCampaign.name });
    return { id: ref.id, ...newCampaign };
  }, [audit]);

  const updateCampaign = useCallback(async (id, fields) => {
    const old = dataRef.current.campaigns.find((c) => c.id === id);
    await updateDoc(doc(db, COL.campaigns, id), fields);
    await audit("UPDATE", "campaign", id, { name: old?.name }, fields);
  }, [audit]);

  const deleteCampaign = useCallback(async (id) => {
    const old = dataRef.current.campaigns.find((c) => c.id === id);
    const batch = writeBatch(db);
    batch.delete(doc(db, COL.campaigns, id));
    // Unlink entries from this campaign
    dataRef.current.entries
      .filter((e) => e.campaignId === id)
      .forEach((e) => batch.update(doc(db, COL.entries, e.id), { campaignId: null }));
    await batch.commit();
    await audit("DELETE", "campaign", id, { name: old?.name }, null);
  }, [audit]);

  // ── Entries CRUD ────────────────────────────────────────────────────────
  const addEntry = useCallback(async (fields) => {
    const newEntry = {
      ...fields,
      date: fields.date || fields.startDate || todayStr(),
      startDate: fields.date || fields.startDate || todayStr(),
      endDate: fields.date || fields.endDate || todayStr(),
      boost: Number(fields.boost || fields.spend || 0),
      spend: Number(fields.boost || fields.spend || 0),
      staffId: fields.staffId || user?.id || null,
      createdAt: Date.now(),
      createdBy: user?.id || null,
      updatedAt: null,
      updatedBy: null,
    };
    const ref = await addDoc(collection(db, COL.entries), newEntry);
    await audit("CREATE", "entry", ref.id, null, {
      date: newEntry.date, pageId: newEntry.pageId, spend: newEntry.boost,
    });
    return { id: ref.id, ...newEntry };
  }, [audit, user]);

  const updateEntry = useCallback(async (id, fields) => {
    const old = dataRef.current.entries.find((e) => e.id === id);
    const updates = {
      ...fields,
      boost: Number(fields.boost ?? fields.spend ?? old?.boost),
      spend: Number(fields.boost ?? fields.spend ?? old?.boost),
      updatedAt: Date.now(),
      updatedBy: user?.id || null,
    };
    await updateDoc(doc(db, COL.entries, id), updates);
    await audit("UPDATE", "entry", id, { boost: old?.boost }, fields);
  }, [audit, user]);

  const deleteEntry = useCallback(async (id) => {
    const old = dataRef.current.entries.find((e) => e.id === id);
    await deleteDoc(doc(db, COL.entries, id));
    await audit("DELETE", "entry", id, { date: old?.date, pageId: old?.pageId }, null);
  }, [audit]);

  // ── FB Token management ─────────────────────────────────────────────────
  const _saveSettings = useCallback(async (updates) => {
    await setDoc(doc(db, COL.settings, "global"), updates, { merge: true });
  }, []);

  const addFbToken = useCallback(async (name, token) => {
    const newToken = { id: uid(), name: name.trim(), token: token.trim(), createdAt: Date.now() };
    const newTokens = [...dataRef.current.fbTokens, newToken];
    await _saveSettings({ fbTokens: newTokens, fbAccessToken: dataRef.current.fbAccessToken || newToken.token });
  }, [_saveSettings]);

  const deleteFbToken = useCallback(async (id) => {
    const newTokens = dataRef.current.fbTokens.filter((t) => t.id !== id);
    await _saveSettings({ fbTokens: newTokens });
  }, [_saveSettings]);

  const saveFbToken = useCallback(async (token) => {
    await _saveSettings({ fbAccessToken: token });
  }, [_saveSettings]);

  const getTokenForPage = useCallback((page) => {
    if (page?.tokenId) {
      const match = dataRef.current.fbTokens.find((t) => t.id === page.tokenId);
      if (match?.token) return match.token;
    }
    return dataRef.current.fbAccessToken || dataRef.current.fbTokens[0]?.token || "";
  }, []);

  // ── Restore from backup ────────────────────────────────────────────────
  const restoreData = useCallback(async (imported) => {
    // Write all collections in batches
    const batch = writeBatch(db);
    (imported.pages || []).forEach((p) => {
      const { id, ...rest } = p;
      batch.set(doc(db, COL.pages, id || uid()), rest);
    });
    (imported.entries || []).forEach((e) => {
      const { id, ...rest } = e;
      batch.set(doc(db, COL.entries, id || uid()), rest);
    });
    (imported.campaigns || []).forEach((c) => {
      const { id, ...rest } = c;
      batch.set(doc(db, COL.campaigns, id || uid()), rest);
    });
    (imported.pageStaffAssignments || []).forEach((a) => {
      const { id, ...rest } = a;
      batch.set(doc(db, COL.assignments, id || uid()), rest);
    });
    await batch.commit();
    if (imported.fbTokens || imported.fbAccessToken) {
      await _saveSettings({
        fbTokens: imported.fbTokens || [],
        fbAccessToken: imported.fbAccessToken || "",
      });
    }
  }, [_saveSettings]);

  // ── Migrate from localStorage ──────────────────────────────────────────
  const migrateFromLocalStorage = useCallback(async () => {
    const STORAGE_KEY = "boost-tracker-data-v3";
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { migrated: false, reason: "No localStorage data found" };

    const lsData = JSON.parse(raw);
    await restoreData(lsData);
    return { migrated: true, counts: {
      pages: (lsData.pages || []).length,
      entries: (lsData.entries || []).length,
      campaigns: (lsData.campaigns || []).length,
    }};
  }, [restoreData]);

  if (loading || !data) return null;

  return (
    <DataContext.Provider value={{
      data,
      // staff
      addStaff, updateStaff, deactivateStaff, reactivateStaff, deleteStaff,
      // pages
      addPage, updatePage, deletePage,
      // campaigns
      addCampaign, updateCampaign, deleteCampaign,
      // entries
      addEntry, updateEntry, deleteEntry,
      // fb
      addFbToken, deleteFbToken, saveFbToken, getTokenForPage,
      // misc
      restoreData, migrateFromLocalStorage,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
