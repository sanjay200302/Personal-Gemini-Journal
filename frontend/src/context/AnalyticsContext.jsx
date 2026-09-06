import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { deleteJournal as apiDeleteJournal, growthTracking } from "../services/api";
import {
  getUserJournals,
  getUserSettings,
  getUserCapsules,
  deleteUserJournal,
} from "../services/firestore";

const AnalyticsContext = createContext();

/**
 * Calculates consecutive days with at least one journal entry in user's timezone.
 * Multiple entries on the same day count as one day.
 * If a day is missed, streak resets.
 */
export function calculateConsecutiveDayStreak(journals, timezone = "UTC") {
  if (!journals || journals.length === 0) return 0;

  const entryDates = new Set();
  journals.forEach((j) => {
    const raw = j.createdAt?.toMillis ? new Date(j.createdAt.toMillis()) : new Date(j.createdAt || j.date || 0);
    if (!isNaN(raw.getTime()) && raw.getTime() > 0) {
      try {
        const dateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(raw);
        entryDates.add(dateStr);
      } catch {
        entryDates.add(raw.toISOString().split("T")[0]);
      }
    }
  });

  if (entryDates.size === 0) return 0;

  let current;
  try {
    const nowStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    current = new Date(nowStr + "T00:00:00Z");
  } catch {
    current = new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z");
  }

  const todayStr = current.toISOString().split("T")[0];
  const yesterday = new Date(current);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let checkDate = new Date(current);

  // If no entry today, check if yesterday had an entry to keep streak alive
  if (!entryDates.has(todayStr)) {
    if (!entryDates.has(yesterdayStr)) {
      return 0; // Streak broken
    }
    checkDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const dStr = checkDate.toISOString().split("T")[0];
    if (entryDates.has(dStr)) {
      streak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function AnalyticsProvider({ children }) {
  const { user, getToken } = useAuth();
  const [journals, setJournals] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [firestoreStreak, setFirestoreStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState([]);
  const fetchGeneration = useRef(0);
  const deletedJournalIds = useRef(new Set());
  const [timezone, setTimezone] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_timezone");
      if (saved) return saved;
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  // Load from local storage cache initially for zero latency
  useEffect(() => {
    deletedJournalIds.current.clear();

    if (!user?.uid) {
      setJournals([]);
      setCapsules([]);
      setGrowthData([]);
      setLoading(false);
      return;
    }

    try {
      const cached = localStorage.getItem(`aura_analytics_cache_${user.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.journals)) {
          setJournals(parsed.journals);
        }
        if (Array.isArray(parsed.capsules)) {
          setCapsules(parsed.capsules);
        }
        if (typeof parsed.firestoreStreak === "number") {
          setFirestoreStreak(parsed.firestoreStreak);
        }
        if (Array.isArray(parsed.growthData)) {
          setGrowthData(parsed.growthData);
        }
        setLoading(false);
      }
    } catch {}
  }, [user?.uid]);

  // Main data fetching method
  const fetchAnalyticsData = useCallback(async (force = false) => {
    if (!user?.uid) {
      setJournals([]);
      setCapsules([]);
      setLoading(false);
      return;
    }

    const generation = ++fetchGeneration.current;
    setLoading(true);
    try {
      // 1. Fetch user timezone & streak from Firestore user_settings
      let currentStreakFromFs = null;
      try {
        const settings = await getUserSettings(user.uid);
        if (settings?.timezone) {
          setTimezone(settings.timezone);
          localStorage.setItem("aura_timezone", settings.timezone);
        }
        if (typeof settings?.streak === "number") {
          currentStreakFromFs = settings.streak;
          setFirestoreStreak(settings.streak);
        }
      } catch {}

      // 2. Fetch capsules from Firestore 'capsules' collection
      let userCapsules = [];
      try {
        userCapsules = await getUserCapsules(user.uid);
        setCapsules(userCapsules || []);
      } catch (capErr) {
        console.warn("Capsules fetch note:", capErr);
      }

      const token = await getToken();
      let userJournals = [];

      // Firestore is authoritative because journal saves and deletes use this collection.
      try {
        userJournals = await getUserJournals(user.uid, 50);
      } catch (fsErr) {
        console.warn("Firestore query note:", fsErr.message);
      }

      // Ignore an older request that started before a delete-triggered reload.
      if (generation !== fetchGeneration.current) return;

      userJournals = userJournals.filter(
        (journal) => !deletedJournalIds.current.has(
          journal.id || journal.journalId || journal._id || journal.documentId
        )
      );

      // Sort newest first
      userJournals.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || a.date || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });

      setJournals(userJournals);

      // 5. Growth metrics computation
      let computedGrowth = [];
      if (userJournals.length > 0) {
        try {
          if (token) {
            const recentEntry = userJournals[0]?.content || "Mindfulness reflection.";
            await growthTracking({ entry: recentEntry }, token);
          }
          const baseScore = Math.min(95, 40 + userJournals.length * 5);
          computedGrowth = [
            { category: "Mindfulness", scores: [40, 50, 60, 65, Math.min(95, baseScore + 5)], color: "#7c6af7" },
            { category: "Consistency", scores: [30, 45, 60, 75, Math.min(100, userJournals.length * 10 + 20)], color: "#f4a05a" },
            { category: "Self-awareness", scores: [35, 45, 55, 65, Math.min(90, baseScore)], color: "#e879a0" },
            { category: "Gratitude", scores: [50, 60, 70, 75, Math.min(95, baseScore + 10)], color: "#4ade80" },
          ];
        } catch {}
      }

      if (generation !== fetchGeneration.current) return;

      setGrowthData(computedGrowth);

      // 6. Update local cache
      try {
        localStorage.setItem(
          `aura_analytics_cache_${user.uid}`,
          JSON.stringify({
            journals: userJournals,
            capsules: userCapsules,
            firestoreStreak: currentStreakFromFs,
            growthData: computedGrowth,
            updatedAt: Date.now(),
          })
        );
      } catch {}
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false);
      }
    }
  }, [user?.uid, getToken]);

  // Initial load
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle Journal Deletion with immediate cache invalidation and shared state update
  const deleteJournalItem = useCallback(
    async (id) => {
      if (!id) return;

      // Delete the Firestore record before changing UI state.
      await deleteUserJournal(id);
      deletedJournalIds.current.add(id);

      // Remove the item only after Firestore confirms deletion.
      setJournals((currentJournals) =>
        currentJournals.filter(
          (journal) => (journal.id || journal.journalId || journal._id || journal.documentId) !== id
        )
      );

      if (user?.uid) {
        localStorage.removeItem(`aura_analytics_cache_${user.uid}`);
      }

      // Keep the legacy backend copy in sync, but never let its stale data be displayed.
      const token = await getToken();
      if (token) {
        try {
          await apiDeleteJournal(id, token);
        } catch (backendError) {
          console.warn("Backend deletion note:", backendError.message);
        }
      }

      // Recalculate streaks, averages, mood maps, and insights from fresh Firestore data.
      await fetchAnalyticsData(true);
    },
    [user?.uid, getToken, fetchAnalyticsData]
  );

  // Derived Analytics Values
  const derivedAnalytics = useMemo(() => {
    const consecutiveStreak = calculateConsecutiveDayStreak(journals, timezone);
    const finalStreak = typeof firestoreStreak === "number" && firestoreStreak > 0
      ? firestoreStreak
      : consecutiveStreak;

    if (!journals || journals.length === 0) {
      return {
        hasData: false,
        streakCount: finalStreak,
        avgMood: "—",
        moodDaily: [],
        moodLabels: [],
        moodGrid: [],
        emotionBreakdown: [],
        stats: {
          entriesWritten: 0,
          avgMood: "—",
          currentStreak: `${finalStreak} ${finalStreak === 1 ? "day in a row" : "days in a row"}`,
          voiceNotes: 0,
        },
      };
    }

    const validMoods = journals
      .map((j) => {
        if (typeof j.mood === "number") return j.mood;
        if (typeof j.moodVal === "number") return j.moodVal;
        return null;
      })
      .filter((m) => m !== null);

    const dailyScores = validMoods.length > 0 ? validMoods : [7];
    const labels = journals.map((j, i) => {
      if (j.createdAt) {
        try {
          const d = new Date(j.createdAt?.toMillis ? j.createdAt.toMillis() : j.createdAt);
          return new Intl.DateTimeFormat("en-US", {
            month: "numeric",
            day: "numeric",
            timeZone: timezone,
          }).format(d);
        } catch {
          return `D${i + 1}`;
        }
      }
      return `Day ${i + 1}`;
    });

    const avgScore =
      dailyScores.length > 0
        ? (dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length).toFixed(1)
        : "—";

    const baseMood = dailyScores[0] || 7;
    const grid = Array.from({ length: 7 }, () =>
      Array.from({ length: 7 }, () => Math.min(10, Math.max(3, baseMood + Math.floor(Math.random() * 3) - 1)))
    );

    const emotionCounts = {
      "😊 Content": 0,
      "🌟 Inspired": 0,
      "😐 Neutral": 0,
      "😢 Melancholy": 0,
      "😄 Joyful": 0,
    };

    journals.forEach((j) => {
      const val = typeof j.mood === "number" ? j.mood : j.moodVal || 7;
      if (val >= 9) emotionCounts["😄 Joyful"]++;
      else if (val >= 8) emotionCounts["🌟 Inspired"]++;
      else if (val >= 6) emotionCounts["😊 Content"]++;
      else if (val >= 4) emotionCounts["😐 Neutral"]++;
      else emotionCounts["😢 Melancholy"]++;
    });

    const totalE = Math.max(1, journals.length);
    const breakdown = [
      { emoji: "😊", label: "Content", pct: Math.round((emotionCounts["😊 Content"] / totalE) * 100) },
      { emoji: "🌟", label: "Inspired", pct: Math.round((emotionCounts["🌟 Inspired"] / totalE) * 100) },
      { emoji: "😐", label: "Neutral", pct: Math.round((emotionCounts["😐 Neutral"] / totalE) * 100) },
      { emoji: "😢", label: "Melancholy", pct: Math.round((emotionCounts["😢 Melancholy"] / totalE) * 100) },
      { emoji: "😄", label: "Joyful", pct: Math.round((emotionCounts["😄 Joyful"] / totalE) * 100) },
    ].filter((e) => e.pct > 0);

    return {
      hasData: true,
      streakCount: finalStreak,
      avgMood: avgScore,
      moodDaily: dailyScores,
      moodLabels: labels,
      moodGrid: grid,
      emotionBreakdown: breakdown.length > 0 ? breakdown : [{ emoji: "✦", label: "Logged Reflections", pct: 100 }],
      stats: {
        entriesWritten: journals.length,
        avgMood: avgScore,
        currentStreak: `${finalStreak} ${finalStreak === 1 ? "day in a row" : "days in a row"}`,
        voiceNotes: journals.filter((j) => j.audioUrl || j.hasAudio).length,
      },
    };
  }, [journals, timezone, firestoreStreak]);

  const value = {
    journals,
    setJournals,
    capsules,
    setCapsules,
    loading,
    growthData,
    timezone,
    setTimezone,
    fetchAnalyticsData,
    deleteJournalItem,
    ...derivedAnalytics,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

export default AnalyticsContext;
