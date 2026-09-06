import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAnalytics } from "../context/AnalyticsContext.jsx";
import ThemeSwitcher from "../components/UI/ThemeSwitcher.jsx";

export default function JournalsList({ navigate: propNavigate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const routerNavigate = useNavigate();
  const { user } = useAuth();
  const {
    journals,
    loading,
    timezone,
    deleteJournalItem,
  } = useAnalytics();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this reflection?")) return;

    setDeletingId(id);
    setDeleteError("");
    try {
      // Calls shared context delete: clears localStorage cache, updates state across app, and syncs backend
      await deleteJournalItem(id);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteError("Failed to delete journal entry.");
      setTimeout(() => setDeleteError(""), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchSearch =
        (j.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.content || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (moodFilter === "all") return true;
      const moodVal = typeof j.mood === "number" ? j.mood : j.moodVal || 0;
      if (moodFilter === "positive") return moodVal >= 7;
      if (moodFilter === "neutral") return moodVal >= 4 && moodVal < 7;
      if (moodFilter === "reflective") return moodVal < 4;
      return true;
    });
  }, [journals, searchTerm, moodFilter]);

  const formatDate = (raw) => {
    if (!raw) return "Recent";
    try {
      const d = new Date(raw?.toMillis ? raw.toMillis() : raw);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: timezone,
      }).format(d);
    } catch {
      return String(raw);
    }
  };

  const getMoodEmoji = (mood) => {
    if (typeof mood === "string" && mood.length <= 2) return mood;
    const val = Number(mood);
    if (val >= 9) return "😄";
    if (val >= 7) return "😊";
    if (val >= 5) return "😐";
    if (val >= 3) return "😕";
    if (val >= 1) return "😢";
    return "📝";
  };

  const visibleList = filteredJournals.slice(0, visibleCount);

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
            ALL JOURNALS ({journals.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={() => navigate("/journals/new")}
            className="px-5 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
          >
            + Create New Journal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {deleteError && (
            <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs font-mono animate-fade-in">
              {deleteError}
            </div>
          )}

          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <span className="absolute left-3.5 top-2.5 text-muted text-xs font-mono">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reflections, insights, keywords…"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-ink text-xs focus:outline-none focus:border-violet/60"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Moods" },
                { id: "positive", label: "😊 Positive" },
                { id: "neutral", label: "😐 Neutral" },
                { id: "reflective", label: "🌱 Reflective" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMoodFilter(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    moodFilter === m.id
                      ? "bg-violet text-white border-violet shadow-sm"
                      : "border-border text-muted hover:text-ink hover:bg-card"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
              <p className="text-muted text-xs font-mono animate-pulse">
                Loading your reflections from Firestore…
              </p>
            </div>
          ) : filteredJournals.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl bg-card border border-dashed border-border max-w-md mx-auto animate-fade-up">
              <span className="text-4xl mb-3 block text-violet-light">✦</span>
              <h3 className="font-display text-2xl font-light mb-2">
                {journals.length === 0 ? "No journals written yet" : "No matching reflections"}
              </h3>
              <p className="text-muted text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                {journals.length === 0
                  ? "Begin your mindful practice. Your reflections, emotions, and growth will be documented here."
                  : "Try adjusting your search terms or mood filter."}
              </p>
              <button
                onClick={() => navigate("/journals/new")}
                className="px-6 py-2.5 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
              >
                + Create New Journal
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
                {visibleList.map((j) => {
                  const id = j.id || j.journalId || j._id || j.documentId;
                  const emoji = getMoodEmoji(j.mood);
                  const isDeleting = deletingId === id;
                  return (
                    <div
                      key={id}
                      onClick={() => navigate(`/journals/${id}`)}
                      className="p-5 rounded-2xl border border-border bg-card hover:border-violet/40 hover:bg-card-hover transition-all cursor-pointer flex flex-col justify-between group relative"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{emoji}</span>
                            {j.mood && (
                              <span className="text-[10px] font-mono text-violet-light px-2 py-0.5 rounded-md bg-violet/10 border border-violet/20">
                                {j.mood}/10
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted font-mono">
                            {formatDate(j.createdAt || j.date)}
                          </span>
                        </div>

                        <h3 className="font-display text-lg text-ink group-hover:text-violet-light transition-colors mb-1.5 line-clamp-1">
                          {j.title || "Untitled Reflection"}
                        </h3>

                        {(j.photoURL || (Array.isArray(j.attachments) && j.attachments[0])) && (
                          <div className="mb-3 rounded-xl overflow-hidden h-28 w-full bg-surface border border-border">
                            <img
                              src={j.photoURL || j.attachments[0]}
                              alt={j.title || "Journal visual"}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <p className="text-muted-light text-xs leading-relaxed line-clamp-3 mb-4">
                          {j.content || "No text content recorded for this reflection."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted">
                        <span className="font-mono text-[10px]">
                          {(j.content || "").trim().split(/\s+/).filter(Boolean).length} words
                          {j.attachments?.length > 0
                            ? ` · 📷 ${j.attachments.length} photo${j.attachments.length > 1 ? "s" : ""}`
                            : j.photoURL
                            ? " · 📷 Photo"
                            : ""}
                          {j.audioUrl ? " · 🎙 Voice Note" : ""}
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, id)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg hover:bg-rose/10 text-muted hover:text-rose transition-colors text-xs font-mono cursor-pointer disabled:opacity-50"
                            title="Delete entry from Journal Agent"
                          >
                            {isDeleting ? "Deleting…" : "🗑 Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/journals/${id}`);
                            }}
                            className="text-violet-light font-mono font-medium hover:text-violet group-hover:translate-x-0.5 transition-all flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                            title="Open reflection detail"
                          >
                            Open →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button if more items exist */}
              {visibleCount < filteredJournals.length && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                    className="px-6 py-2 rounded-full border border-border text-muted hover:text-ink hover:bg-card text-xs font-mono transition-all cursor-pointer"
                  >
                    Load More Entries ({filteredJournals.length - visibleCount} remaining) ↓
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
