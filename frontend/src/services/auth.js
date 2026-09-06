import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Log in with email and password using Firebase Auth.
 * Throws real Firebase errors (auth/wrong-password, auth/user-not-found, etc.)
 */
export async function login(email, password) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Check your Firebase configuration.");
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Register a new user with email, password, and optional display name.
 */
export async function register(email, password, displayName = "") {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Check your Firebase configuration.");
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

/**
 * Sign in with Google popup.
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/**
 * Sign in with GitHub popup.
 */
export async function loginWithGithub() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/**
 * Sign out current user.
 */
export async function logout() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Send password reset email.
 */
export async function resetPassword(email) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get JWT token of the currently authenticated user.
 */
export async function getCurrentUserToken() {
  if (!auth || !auth.currentUser) return null;
  return await auth.currentUser.getIdToken(true);
}

export default {
  login,
  register,
  loginWithGoogle,
  loginWithGithub,
  logout,
  resetPassword,
  getCurrentUserToken,
};
