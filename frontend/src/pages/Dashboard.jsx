import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAnalytics } from "../context/AnalyticsContext.jsx";
import { MoodSparkline } from "../components/Journal/MoodTracker.jsx";
import ThemeSwitcher from "../components/UI/ThemeSwitcher.jsx";

const NAV_ITEMS = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "journals", icon: "✦", label: "Journals" },
  { id: "analytics", icon: "◈", label: "Analytics" },
  { id: "capsule", icon: "⬡", label: "Capsule" },
  { id: "settings", icon: "⊕", label: "Settings" },
];

function Sidebar({ active, navigate, collapsed, setCollapsed, user }) {
  const handleNav = (id) => {
    if (id === "dashboard") navigate("dashboard");
    else if (id === "journals") navigate("journals");
    else if (id === "analytics") navigate("analytics");
    else if (id === "capsule") navigate("capsule");
    else if (id === "settings") navigate("settings");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <aside
      className={`flex-none flex flex-col border-r border-border bg-surface transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand Header with Purple Accent Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <button
          onClick={() => navigate("landing")}
          className="flex-none w-7 h-7 rounded-lg bg-violet text-white flex items-center justify-center font-bold text-xs hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
          aria-label="Home"
        >
          ✦
        </button>
        {!collapsed && (
          <span className="font-display text-base font-semibold text-ink">Aura</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted hover:text-ink transition-colors text-xs p-1 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              active === item.id
                ? "bg-violet-glow text-violet-light font-medium"
                : "text-muted-light hover:text-ink hover:bg-card"
            }`}
          >
            <span className="flex-none text-base font-mono">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-border">
        <div
          onClick={() => navigate("settings")}
          className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-card transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex-none w-8 h-8 rounded-full bg-violet/30 flex items-center justify-center text-xs font-medium text-violet-light border border-violet/40">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink truncate font-medium">{displayName}</p>
              <p className="text-xs text-muted truncate">{user?.email || "Signed in"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function Dashboard({ navigate: propNavigate }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const routerNavigate = useNavigate();
  const { user } = useAuth();
  const {
    journals,
    capsules,
    loading,
    streakCount,
    avgMood,
    growthData,
    timezone,
  } = useAnalytics();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  // Keep live time ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic greeting based on system time and user timezone
  const { greeting, formattedDate, formattedTime } = useMemo(() => {
    try {
      const formatterHour = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      });
      const hour = parseInt(formatterHour.format(currentTime), 10) || currentTime.getHours();

      let greet = "Good evening";
      if (hour >= 5 && hour < 12) {
        greet = "Good morning";
      } else if (hour >= 12 && hour < 17) {
        greet = "Good afternoon";
      } else if (hour >= 17 && hour < 22) {
        greet = "Good evening";
      } else {
        greet = "Good night";
      }

      const dateStr = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: timezone,
      }).format(currentTime).toUpperCase();

      const timeStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }).format(currentTime);

      return {
        greeting: greet,
        formattedDate: dateStr,
        formattedTime: timeStr,
      };
    } catch {
      return {
        greeting: "Welcome back",
        formattedDate: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase(),
        formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    }
  }, [currentTime, timezone]);

  // Derived Mood Sparkline Data for Dashboard
  const moodTrendWeekly = useMemo(() => {
    if (!journals || journals.length === 0) return [7, 7, 7, 7, 7, 7, 7];

    const validMoods = journals
      .map((j) => {
        if (typeof j.mood === "number") return j.mood;
        if (typeof j.moodVal === "number") return j.moodVal;
        return null;
      })
      .filter((m) => m !== null);

    if (validMoods.length >= 7) {
      return validMoods.slice(0, 7).reverse();
    }
    if (validMoods.length > 0) {
      return [...Array(Math.max(0, 7 - validMoods.length)).fill(validMoods[0]), ...validMoods].slice(-7);
    }
    return [6, 7, 7, 8, 8, 9, 8];
  }, [journals]);

  // Derived Growth Metrics for Dashboard
  const growthMetrics = useMemo(() => {
    if (!journals || journals.length === 0) {
      return [
        { label: "Mindfulness", pct: 0, color: "#7c6af7" },
        { label: "Consistency", pct: 0, color: "#f4a05a" },
        { label: "Self-awareness", pct: 0, color: "#e879a0" },
      ];
    }

    const totalWords = journals.reduce((acc, j) => {
      const text = j.content || "";
      return acc + text.trim().split(/\s+/).filter(Boolean).length;
    }, 0);

    const consistencyPct = Math.min(100, Math.round((streakCount / 7) * 100));
    const mindfulnessPct = Math.min(100, Math.round((totalWords / 500) * 100));
    const awarenessPct = Math.min(100, Math.round(journals.length > 0 ? (journals.length / 5) * 100 : 20));

    return [
      { label: "Mindfulness", pct: mindfulnessPct || 10, color: "#7c6af7" },
      { label: "Consistency", pct: consistencyPct || 10, color: "#f4a05a" },
      { label: "Self-awareness", pct: awarenessPct || 10, color: "#e879a0" },
    ];
  }, [journals, streakCount]);

  const MOOD_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

  const displayName = user?.displayName
    ? user.displayName.split(" ")[0]
    : user?.email?.split("@")[0] || "Friend";

  const totalCapsulesCount = capsules?.length || 0;

  return (
    <div className="h-full min-h-screen flex bg-ground text-ink">
      <Sidebar
        active="dashboard"
        navigate={navigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sticky Header with Purple Accent Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-8 py-4 border-b border-border bg-ground/90 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-muted font-mono text-xs tracking-widest">
                {formattedDate}
              </p>
              <span className="text-muted text-xs font-mono">· {formattedTime}</span>
            </div>
            <h1 className="font-display text-2xl font-light mt-0.5">
              {greeting}, {displayName} ✦
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => navigate("/journals/new")}
              className="px-5 py-2 rounded-full bg-violet text-white text-sm font-medium hover:bg-violet-dim transition-all shadow-lg shadow-violet/20 cursor-pointer"
            >
              + New Entry
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-w-6xl">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Streak",
                value: streakCount,
                unit: streakCount === 1 ? "day in a row" : "days in a row",
                icon: "🔥",
                color: "text-amber",
              },
              {
                label: "Mood Today",
                value: avgMood,
                unit: "/ 10",
                icon: "😊",
                color: "text-green",
              },
              {
                label: "Total Entries",
                value: journals.length,
                unit: journals.length === 1 ? "journal" : "journals",
                icon: "✦",
                color: "text-violet-light",
              },
              {
                label: "Capsules",
                value: totalCapsulesCount,
                unit: totalCapsulesCount === 1 ? "capsule" : "capsules",
                icon: "⬡",
                color: "text-violet-light",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-xl border border-border bg-card hover:border-violet/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted font-mono text-xs tracking-widest">
                    {s.label.toUpperCase()}
                  </p>
                  <span className="text-base">{s.icon}</span>
                </div>
                <div className="flex items-end gap-1.5 flex-wrap">
                  <span className={`font-display text-3xl ${s.color}`}>
                    {s.value}
                  </span>
                  <span className="text-muted text-xs font-mono mb-0.5">
                    {s.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-5">
            {/* Recent Journals */}
            <div className="col-span-12 md:col-span-7 p-5 rounded-2xl border border-border bg-card flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl">Recent Journals</h2>
                <button
                  onClick={() => navigate("/journals")}
                  className="text-xs text-violet-light hover:text-violet font-mono tracking-wide transition-colors cursor-pointer"
                >
                  VIEW ALL →
                </button>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
                  <p className="text-muted text-xs font-mono animate-pulse">
                    Fetching journals from agents…
                  </p>
                </div>
              ) : journals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-surface/50 border border-dashed border-border">
                  <span className="text-3xl mb-3 text-violet-light">✦</span>
                  <p className="font-medium text-ink mb-1">No journals written yet</p>
                  <p className="text-muted text-xs max-w-sm mb-4">
                    Your personal reflections will appear here once you write your first entry.
                  </p>
                  <button
                    onClick={() => navigate("/journals/new")}
                    className="px-4 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
                  >
                    + Write your first entry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {journals.slice(0, 5).map((j) => {
                    const id = j.id || j.journalId;
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(`/journals/${id}`)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-card-hover transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex-none w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-lg">
                          {typeof j.mood === "string" ? j.mood : "📝"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-ink group-hover:text-violet-light transition-colors truncate">
                              {j.title || "Untitled Reflection"}
                            </p>
                            <span className="flex-none text-[10px] text-muted font-mono">
                              {j.createdAt
                                ? new Date(
                                    j.createdAt?.toMillis ? j.createdAt.toMillis() : j.createdAt
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    timeZone: timezone,
                                  })
                                : j.date || "Recently"}
                            </span>
                          </div>
                          <p className="text-muted text-xs leading-relaxed mt-0.5 line-clamp-1">
                            {j.content || j.preview || "No preview text"}
                          </p>
                        </div>
                        <div className="flex-none self-center text-muted group-hover:text-ink transition-colors text-xs">
                          →
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column (Mood sparkline & Growth progress) */}
            <div className="col-span-12 md:col-span-5 space-y-5">
              {/* Mood Chart */}
              <div
                onClick={() => navigate("analytics")}
                className="p-5 rounded-2xl border border-border bg-card cursor-pointer hover:border-violet/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-muted font-mono text-xs tracking-widest uppercase">
                      MOOD TREND
                    </p>
                    <p className="font-display text-xl mt-0.5">This Week</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl text-violet-light">
                      {avgMood}/10
                    </p>
                    <p className="text-muted text-xs font-mono">average score</p>
                  </div>
                </div>
                <MoodSparkline data={moodTrendWeekly} />
                <div className="flex justify-between mt-1">
                  {MOOD_DAYS.map((d, i) => (
                    <span key={i} className="text-[10px] text-muted font-mono">
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted mt-3 font-mono">
                  Click to explore analytics →
                </p>
              </div>

              {/* Growth Overview */}
              <div
                onClick={() => navigate("analytics")}
                className="p-5 rounded-2xl border border-border bg-card cursor-pointer hover:border-violet/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl">Growth Tracker</h2>
                  <span className="text-xs text-violet-light font-mono">→</span>
                </div>
                <div className="space-y-3">
                  {growthMetrics.map((g) => (
                    <div key={g.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-dim">{g.label}</span>
                        <span className="text-muted font-mono">{g.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${g.pct}%`, background: g.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Capsule Teaser Banner - Exactly Synced with Firestore capsules collection */}
          <div
            onClick={() => navigate("capsule")}
            className="p-6 rounded-2xl border border-violet/30 bg-gradient-to-r from-violet/10 to-transparent cursor-pointer hover:border-violet/50 transition-all flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-violet/15 flex items-center justify-center text-2xl text-violet-light border border-violet/30">
              ⬡
            </div>
            <div className="flex-1">
              <p className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">
                GROWTH CAPSULES
              </p>
              <h3 className="font-display text-xl">
                {totalCapsulesCount === 0 ? "No capsules yet" : "A message from past-you awaits"}
              </h3>
              <p className="text-muted text-sm mt-0.5">
                {totalCapsulesCount === 0
                  ? "Lock a letter in time for your future self to unlock at a future milestone."
                  : `${totalCapsulesCount} capsule${totalCapsulesCount > 1 ? "s" : ""} recorded in Firestore.`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-violet-light">
                {totalCapsulesCount}
              </p>
              <p className="text-muted text-xs font-mono">
                {totalCapsulesCount === 0 ? "+ Create" : "total capsules"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
