import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import * as authService from "../services/auth";
import { ensureUserSettings } from "../services/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (auth && typeof onAuthStateChanged === "function") {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            // Auto-create default user_settings document if needed
            await ensureUserSettings(currentUser);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn("Auth initialization note:", err);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
    if (loggedUser) await ensureUserSettings(loggedUser);
    return loggedUser;
  };

  const signup = async (email, password, displayName = "") => {
    const newUser = await authService.register(email, password, displayName);
    setUser(newUser);
    if (newUser) await ensureUserSettings(newUser);
    return newUser;
  };

  const loginWithGoogle = async () => {
    const googleUser = await authService.loginWithGoogle();
    setUser(googleUser);
    if (googleUser) await ensureUserSettings(googleUser);
    return googleUser;
  };

  const loginWithGithub = async () => {
    const githubUser = await authService.loginWithGithub();
    setUser(githubUser);
    if (githubUser) await ensureUserSettings(githubUser);
    return githubUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const resetPassword = async (email) => {
    await authService.resetPassword(email);
  };

  const getToken = async () => {
    if (user && typeof user.getIdToken === "function") {
      return await user.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginWithGithub,
        logout,
        resetPassword,
        getToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
