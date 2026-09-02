// Firebase SDK initialization for Boost Ops Tracker
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "boost-ops-tracker",
  appId: "1:884531474061:web:798ec00c6970f6e4a73cc4",
  storageBucket: "boost-ops-tracker.firebasestorage.app",
  apiKey: "AIzaSyBRGqbfit9txEyhld7msrk2_OZND0JKsBE",
  authDomain: "boost-ops-tracker.firebaseapp.com",
  messagingSenderId: "884531474061",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Helpers
export const EMAIL_DOMAIN = "boost-ops.web.app";
export const toEmail = (username) => `${username}@${EMAIL_DOMAIN}`;

// Firebase Auth REST API base (for admin operations that don't change session)
export const AUTH_REST = `https://identitytoolkit.googleapis.com/v1/accounts`;
export const API_KEY = firebaseConfig.apiKey;
