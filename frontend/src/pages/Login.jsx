import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserJournals } from "../services/firestore";
import LoginForm from "../components/Auth/LoginForm.jsx";

export default function Login({ navigate: propNavigate, initialMode = "login" }) {
  const [userStats, setUserStats] = useState(null);
  const routerNavigate = useNavigate();
  const { user } = useAuth();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  useEffect(() => {
    if (user?.uid) {
      getUserJournals(user.uid)
        .then((journals) => {
          if (journals && journals.length > 0) {
            setUserStats({
              totalEntries: journals.length,
              streak: Math.max(1, journals.length),
              latestDate: journals[0]?.createdAt
                ? new Date(journals[0].createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Active",
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || null;

  return (
    <div className="h-full min-h-screen bg-ground text-ink flex">
      {/* Left panel (Desktop) */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 border-r border-border bg-surface relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet opacity-10 blur-3xl" />
        </div>

        <div className="relative">
          <button
            onClick={() => navigate("landing")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-violet aura-glow" />
            <span className="font-display text-lg font-semibold tracking-wide">Aura</span>
          </button>
        </div>

        <div className="relative">
          <blockquote className="font-display text-3xl font-light leading-snug text-ink mb-6">
            "The journey inward is the most important journey you will ever take."
          </blockquote>

          {displayName ? (
            <div className="p-4 rounded-xl border border-border bg-card/60 flex items-center gap-3 animate-fade-up">
              <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center text-sm font-medium text-violet-light">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{displayName}</p>
                <p className="text-xs text-muted font-mono">
                  {userStats
                    ? `${userStats.totalEntries} entries recorded · ${userStats.streak}d streak`
                    : "Connected Account"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-light text-sm leading-relaxed max-w-md">
              A private, encrypted reflection sanctuary designed to help you process thoughts, understand emotional patterns, and track personal transformation over time.
            </p>
          )}
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-center">
          {[
            ["🔒 Private", "End-to-end encrypted"],
            ["✦ AI Powered", "Gemini intelligence"],
            ["⬡ Growth", "Reflective milestones"],
          ].map(([v, l]) => (
            <div key={l} className="p-3 rounded-xl border border-border bg-card">
              <div className="font-display text-sm font-medium text-violet-light">{v}</div>
              <div className="text-muted text-[11px] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <button
              onClick={() => navigate("landing")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-violet" />
              <span className="font-display text-base font-semibold">Aura</span>
            </button>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-light mb-1">
              {initialMode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-light text-sm">
              {initialMode === "signup"
                ? "Start your personal journaling and growth space"
                : "Sign in to your private reflection sanctuary"}
            </p>
          </div>

          <LoginForm
            initialMode={initialMode}
            onSuccess={() => navigate("dashboard")}
          />
        </div>
      </div>
    </div>
  );
}
