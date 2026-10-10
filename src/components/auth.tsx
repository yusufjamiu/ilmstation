import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Gender = "male" | "female";
export type Zone = "youth" | "adult";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Account = {
  name: string;
  username?: string;
  email: string;
  language: string;
  dob: string;
  gender: Gender;
  zone: Zone;
  interests: string[];
  level: Level;
  quizScore: number | null;
  xp: number;
  createdAt: string;
};

export const normaliseEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const normaliseUsername = (u: string) => u.trim().toLowerCase();
export const isValidUsername = (u: string) => /^[a-z0-9_]{3,20}$/.test(normaliseUsername(u));
/** True when the name is valid and nobody has reserved it yet. Works before login. */
export async function isUsernameAvailable(u: string): Promise<boolean> {
  const name = normaliseUsername(u);
  if (!isValidUsername(name)) return false;
  const snap = await getDoc(doc(db, "usernames", name));
  return !snap.exists();
}

export const passwordRules = [
  { id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Number", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "Symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function ageFrom(dob: string, today = new Date()) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function authErrorMessage(err: unknown): string {
  if ((err as { message?: string })?.message === "USERNAME_TAKEN") return "That username is already taken. Please choose another.";
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password is too weak — use 8+ characters with a number and a capital letter.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "We couldn't find an account with that email and password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function fetchProfile(uid: string): Promise<Account | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? (snap.data() as Account) : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile = await fetchProfile(u.uid);
        setAccount(profile);
      } else {
        setAccount(null);
      }
      setReady(true);
    });
    return unsub;
  }, []);

  return {
    account,
    loggedIn: !!user,
    ready,
    firstName: account?.name.split(/\s+/)[0] ?? "",

    /** Creates a real Firebase account and saves the rich profile to Firestore. */
    signUp: async (details: Omit<Account, "createdAt"> & { password: string }) => {
      const { password, username: rawUsername, ...profile } = details;
      const username = rawUsername ? normaliseUsername(rawUsername) : undefined;
      if (username && !(await isUsernameAvailable(username))) throw new Error("USERNAME_TAKEN");
      const cred = await createUserWithEmailAndPassword(auth, profile.email, password);
      await updateProfile(cred.user, { displayName: profile.name });
      const fullProfile: Account = { ...profile, ...(username ? { username } : {}), createdAt: new Date().toISOString() };
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "profiles", cred.user.uid), fullProfile);
        if (username) batch.set(doc(db, "usernames", username), { uid: cred.user.uid });
        await batch.commit();
      } catch (err) {
        await cred.user.delete().catch(() => {});
        throw username && (err as { code?: string })?.code === "permission-denied" ? new Error("USERNAME_TAKEN") : err;
      }
      setAccount(fullProfile);
      return null;
    },

    /** Resolves with an error message, or null on success. */
    logIn: async (email: string, password: string): Promise<string | null> => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchProfile(cred.user.uid);
        setAccount(profile);
        return null;
      } catch (err) {
        return authErrorMessage(err);
      }
    },

    logOut: async () => {
      await signOut(auth);
      setAccount(null);
    },
  };
}
