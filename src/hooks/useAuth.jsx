import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, getDocs, limit } from "firebase/firestore";
import { auth, db } from "../lib/firebase.js";
import { login as doLogin, logout as doLogout, bootstrapAdmin, createAuthUser } from "../lib/auth.js";
import { COLORS } from "../lib/colors.js";
import { uid } from "../lib/helpers.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load user profile from Firestore
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            const profile = snap.data();
            // Check if user is active
            if (profile.status === "inactive") {
              await doLogout();
              setUser(null);
            } else {
              setUser({ id: firebaseUser.uid, ...profile });
            }
          } else {
            // No Firestore profile → sign out
            await doLogout();
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (username, password) => {
    return doLogin(username, password);
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
  }, []);

  // First-run: create admin in Firebase Auth + Firestore
  const bootstrap = useCallback(async (name, password) => {
    try {
      // Check if any users already exist in Firestore
      const usersSnap = await getDocs(query(collection(db, "users"), limit(1)));
      if (!usersSnap.empty) return false; // already bootstrapped

      const { uid: firebaseUid, username } = await bootstrapAdmin(name, password);

      const adminProfile = {
        name,
        username,
        role: "admin",
        status: "active",
        color: "#E8B24D",
        password: btoa(password), // stored for admin management only
        createdAt: Date.now(),
        lastLogin: null,
      };
      await setDoc(doc(db, "users", firebaseUid), adminProfile);
      // Firebase Auth will trigger onAuthStateChanged to load the profile
      // But createAuthUser doesn't sign in, so we must sign in explicitly
      return await doLogin(username, password);
    } catch (err) {
      console.error("Bootstrap error:", err);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
