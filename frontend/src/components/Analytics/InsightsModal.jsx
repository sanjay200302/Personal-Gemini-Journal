import { useEffect, useState, useCallback } from "react";
import { generateDynamicInsights } from "../../services/analyticsService";
import { useAuth } from "../../context/AuthContext.jsx";

export default function InsightsModal({ isOpen = true, onClose, userJournals = [] }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceInfo, setSourceInfo] = useState({ model: "Your journal data", status: "Computed from your entries" });
  const [transparency, setTransparency] = useState([]);

  const { getToken } = useAuth();

  const fetchDynamicInsights = useCallback(async () => {
    // If no journals exist yet, do not query backend or show mock default insights
    if (!userJournals || userJournals.length === 0) {
      setInsights([]);
      setTransparency([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await generateDynamicInsights(userJournals, token);
      if (res?.insights) {
        setInsights(res.insights);
      }
      if (res?.sourceInfo) {
        setSourceInfo(res.sourceInfo);
      }
      setTransparency(Array.isArray(res?.transparency) ? res.transparency : []);
    } catch (err) {
      console.error("Failed to load dynamic insights:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, userJournals]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      fetchDynamicInsights();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, fetchDynamicInsights]);

  if (!isOpen) return null;

  const hasJournals = userJournals && userJournals.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg p-8 rounded-2xl border border-border bg-card text-ink animate-fade-up shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4 flex-none">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-muted font-mono text-xs tracking-widest uppercase">
                AI INSIGHTS & TRANSPARENCY
              </p>
              {hasJournals && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet/10 text-violet-light border border-violet/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  {sourceInfo.status}
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl">Your patterns, decoded</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink hover:border-violet/40 transition-colors text-lg cursor-pointer"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        <p className="text-muted text-xs mb-4 flex-none">
          Based on {sourceInfo.model}. Each insight is recalculated from your saved reflections.
        </p>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
              <p className="text-muted text-xs font-mono animate-pulse">
                Generating dynamic insights from your reflections…
              </p>
            </div>
          ) : !hasJournals || insights.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl bg-surface/50 border border-dashed border-border flex flex-col items-center justify-center">
              <span className="text-3xl mb-3 text-violet-light">✦</span>
              <p className="font-medium text-sm text-ink mb-1">No insights yet</p>
              <p className="text-muted text-xs max-w-xs leading-relaxed">
                Insights will appear once you start journaling. Write your first reflection to decode your mood and thought patterns.
              </p>
            </div>
          ) : (
            <>
              {insights.map((insight, idx) => (
                <div
                  key={insight.title || idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border hover:border-violet/30 transition-colors"
                >
                  <span className="text-2xl flex-none">{insight.icon || "✦"}</span>
                  <div>
                    <p className="font-medium text-sm text-ink mb-0.5">
                      {insight.title}
                    </p>
                    <p className="text-muted-light text-xs leading-relaxed">
                      {insight.desc || insight.description}
                    </p>
                  </div>
                </div>
              ))}
              {transparency.map((item, idx) => (
                <div key={`transparency-${idx}`} className="p-4 rounded-xl bg-surface/70 border border-border">
                  <p className="font-medium text-sm text-ink mb-0.5">Transparency</p>
                  <p className="text-muted-light text-xs leading-relaxed">
                    {typeof item === "string" ? item : item.description || item.detail || JSON.stringify(item)}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6 flex-none">
          {hasJournals && (
            <button
              type="button"
              onClick={fetchDynamicInsights}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-ink hover:bg-surface transition-colors text-xs font-mono disabled:opacity-60 cursor-pointer"
            >
              ↻ Refresh Insights
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-colors shadow-md shadow-violet/20 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
