import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUserJournals,
  getUserCapsules,
  saveUserCapsule,
  updateUserCapsule,
} from "../services/firestore";
import { capsuleService } from "../services/api";

export default function CapsuleUnlock({ navigate: propNavigate }) {
  const [capsules, setCapsules] = useState([]);
  const [activeCapsule, setActiveCapsule] = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("Letter to My Future Self");
  const [newContent, setNewContent] = useState("");
  const [unlockDays, setUnlockDays] = useState(30);
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving] = useState(false);

  const routerNavigate = useNavigate();
  const { user, getToken } = useAuth();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  const loadData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [userJournals, userCapsules] = await Promise.all([
        getUserJournals(user.uid),
        getUserCapsules(user.uid),
      ]);

      setJournals(userJournals || []);

      if (userCapsules && userCapsules.length > 0) {
        setCapsules(userCapsules);
        setActiveCapsule(userCapsules[0]);
      } else {
        setCapsules([]);
        setActiveCapsule(null);
      }
    } catch (err) {
      console.warn("Failed to load capsule data:", err);
      setCapsules([]);
      setActiveCapsule(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUnlock = async (capsuleToUnlock) => {
    if (!capsuleToUnlock) return;
    setUnlockingId(capsuleToUnlock.id);

    setTimeout(async () => {
      if (user?.uid && capsuleToUnlock.id) {
        await updateUserCapsule(capsuleToUnlock.id, { status: "unlocked" });
      }
      setCapsules((prev) =>
        prev.map((c) =>
          c.id === capsuleToUnlock.id ? { ...c, status: "unlocked" } : c
        )
      );
      setActiveCapsule((prev) => ({ ...prev, status: "unlocked" }));
      setUnlockingId(null);
    }, 1200);
  };

  const handleCreateCapsule = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || !user?.uid) return;
    setSaving(true);
    try {
      let targetDate;
      if (customDate) {
        targetDate = new Date(customDate);
      } else {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + Number(unlockDays));
      }

      const unlockDateStr = targetDate.toISOString().split("T")[0];
      const isReadyToUnlock = targetDate.getTime() <= Date.now();

      const capsulePayload = {
        title: newTitle.trim() || "Letter to My Future Self",
        content: newContent.trim(),
        message: newContent.trim(),
        date: `Written ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        unlockDate: unlockDateStr,
        status: isReadyToUnlock ? "unlocked" : "locked",
        streak: Math.max(1, journals.length),
      };

      // 1. Save to Firestore
      const docId = await saveUserCapsule(user.uid, capsulePayload);
      const savedCapsule = { ...capsulePayload, id: docId };

      // 2. Notify backend analytics capsule service
      try {
        const token = await getToken();
        if (token) {
          await capsuleService(capsulePayload, token);
        }
      } catch {
        // Backend note
      }

      setCapsules((prev) => {
        const updated = [...prev, savedCapsule];
        return updated.sort((a, b) => new Date(a.unlockDate || 0) - new Date(b.unlockDate || 0));
      });
      setActiveCapsule(savedCapsule);
      setIsCreating(false);
      setNewContent("");
      setCustomDate("");
    } catch (err) {
      console.error("Failed to save capsule:", err);
    } finally {
      setSaving(false);
    }
  };

  const streak = journals.length > 0 ? Math.max(1, journals.length) : 1;

  if (loading) {
    return (
      <div className="h-full min-h-screen bg-ground text-ink flex items-center justify-center p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
          <p className="text-muted text-xs font-mono animate-pulse">
            Loading your growth capsule records…
          </p>
        </div>
      </div>
    );
  }

  // Create Capsule Modal / Form
  if (isCreating) {
    return (
      <div className="h-full min-h-screen bg-ground text-ink flex flex-col items-center justify-center p-6 md:p-8">
        <div className="max-w-lg w-full p-8 rounded-2xl border border-border bg-card shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-light">Create Growth Capsule</h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-muted hover:text-ink text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-muted text-xs mb-6">
            Write a letter to your future self. It will remain securely sealed until your unlock milestone.
          </p>

          <form onSubmit={handleCreateCapsule} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-1.5">
                Capsule Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Letter to my future self…"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-ink text-sm focus:outline-none focus:border-violet/60"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-1.5">
                Unlock Milestone
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { label: "7 Days", val: 7 },
                  { label: "30 Days", val: 30 },
                  { label: "90 Days", val: 90 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setUnlockDays(item.val);
                      setCustomDate("");
                    }}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      unlockDays === item.val && !customDate
                        ? "bg-violet text-white border-violet shadow-md shadow-violet/20"
                        : "border-border text-muted hover:text-ink hover:bg-surface"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setUnlockDays(0);
                }}
                className="w-full px-4 py-2 rounded-xl bg-surface border border-border text-ink text-xs font-mono focus:outline-none focus:border-violet/60"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-1.5">
                Your Letter (Content)
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="What are your hopes, intentions, or things you want to remember?…"
                className="w-full h-36 px-4 py-3 rounded-xl bg-surface border border-border text-ink text-sm placeholder-muted resize-none focus:outline-none focus:border-violet/60"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-ink text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newContent.trim()}
                className="flex-1 py-2.5 rounded-xl bg-violet text-white font-medium hover:bg-violet-dim transition-all text-sm shadow-md shadow-violet/20 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Sealing…" : "Seal Capsule 🔒"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isCurrentUnlocked =
    activeCapsule?.status === "unlocked" ||
    (activeCapsule?.unlockDate && new Date(activeCapsule.unlockDate).getTime() <= Date.now());

  return (
    <div className="h-full min-h-screen bg-ground text-ink flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 md:px-8 py-4 border-b border-border bg-ground/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("dashboard")}
            className="text-muted hover:text-ink transition-colors text-sm font-mono flex items-center gap-2 cursor-pointer"
          >
            ← Dashboard
          </button>
          <div className="w-px h-5 bg-border" />
          <span className="text-muted text-xs font-mono uppercase tracking-widest">
            GROWTH CAPSULES
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
        >
          + Create Capsule
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Capsule Selector if multiple */}
          {capsules.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {capsules.map((c, i) => {
                const unlockedBadge =
                  c.status === "unlocked" ||
                  new Date(c.unlockDate).getTime() <= Date.now();
                return (
                  <button
                    key={c.id || i}
                    onClick={() => setActiveCapsule(c)}
                    className={`flex-none px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      activeCapsule?.id === c.id
                        ? "bg-violet text-white shadow-md shadow-violet/20"
                        : "bg-card border border-border text-muted hover:text-ink"
                    }`}
                  >
                    <span>{unlockedBadge ? "🔓" : "🔒"}</span>
                    <span className="truncate max-w-[140px]">{c.title || `Capsule #${i + 1}`}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeCapsule ? (
            isCurrentUnlocked ? (
              /* Unlocked Capsule View */
              <div className="space-y-6 animate-fade-up">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-muted font-mono text-xs tracking-widest uppercase mb-1">
                    CAPSULE UNLOCKED
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-light text-violet-light mb-1">
                    {activeCapsule.title}
                  </h1>
                  <p className="text-muted text-xs font-mono">
                    {activeCapsule.date} · Unlocked on {activeCapsule.unlockDate}
                  </p>
                </div>

                {/* Letter Card */}
                <div className="p-8 rounded-2xl border border-violet/30 bg-card shadow-xl">
                  <div className="whitespace-pre-line text-ink leading-relaxed text-base">
                    {activeCapsule.content || activeCapsule.message}
                  </div>
                </div>

                {/* Achievements */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-amber/30 bg-amber/10 text-center">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="text-xs font-medium text-amber">{streak}-Day Streak</p>
                    <p className="text-[10px] text-muted">{streak} entries logged</p>
                  </div>
                  <div className="p-4 rounded-xl border border-green/30 bg-green/10 text-center">
                    <div className="text-2xl mb-1">🌱</div>
                    <p className="text-xs font-medium text-green">Growth Journey</p>
                    <p className="text-[10px] text-muted">Mindful practice</p>
                  </div>
                  <div className="p-4 rounded-xl border border-violet/30 bg-violet/10 text-center">
                    <div className="text-2xl mb-1">⬡</div>
                    <p className="text-xs font-medium text-violet-light">Milestone Kept</p>
                    <p className="text-[10px] text-muted">Capsule unlocked</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Locked Capsule View */
              <div className="max-w-md mx-auto text-center py-10 animate-fade-up">
                {/* Capsule Visual Orb */}
                <div className="relative mx-auto w-36 h-36 mb-6">
                  <div className="absolute inset-0 rounded-full bg-violet opacity-20 blur-3xl" />
                  <div
                    className={`relative w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                      unlockingId === activeCapsule.id
                        ? "border-violet bg-violet/20 scale-110"
                        : "border-violet/40 bg-violet/5"
                    }`}
                  >
                    <div className="text-5xl">🔒</div>
                  </div>
                </div>

                <h2 className="font-display text-3xl font-light mb-2">
                  {activeCapsule.title}
                </h2>
                <p className="text-muted text-xs font-mono mb-4">
                  {activeCapsule.date} · Unlocks on {activeCapsule.unlockDate}
                </p>

                <p className="text-ink-dim text-sm mb-6 leading-relaxed">
                  This reflection is sealed in time. It will reveal itself when your milestone date arrives.
                </p>

                <div className="p-4 rounded-xl border border-border bg-card mb-6 text-left">
                  <div className="flex justify-between text-xs text-muted font-mono mb-2">
                    <span>Status: Locked</span>
                    <span className="text-violet-light">Sealed</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full bg-violet w-3/4 animate-pulse" />
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleUnlock(activeCapsule)}
                    disabled={unlockingId === activeCapsule.id}
                    className="px-8 py-3 rounded-full bg-violet text-white text-sm font-medium hover:bg-violet-dim shadow-lg shadow-violet/20 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {unlockingId === activeCapsule.id ? "Unlocking…" : "Unlock Now (Manual Unlock)"}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* No Capsule Yet Empty State */
            <div className="text-center py-16 px-4 rounded-2xl bg-card border border-dashed border-border max-w-md mx-auto">
              <span className="text-4xl mb-3 block text-violet-light">⬡</span>
              <h3 className="font-display text-2xl font-light mb-2">No capsules yet</h3>
              <p className="text-muted text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                Lock a letter in time for your future self. It will remain securely sealed until your chosen milestone date.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-2.5 rounded-full bg-violet text-white text-sm font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
              >
                + Create Your First Capsule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
