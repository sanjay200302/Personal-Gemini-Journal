import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "../context/AnalyticsContext.jsx";
import InsightsModal from "../components/Analytics/InsightsModal.jsx";

function MoodTrendsChart({ moodDaily = [], moodLabels = [], navigate }) {
  if (!moodDaily || moodDaily.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <span className="text-3xl mb-3 text-violet-light">✦</span>
        <h3 className="font-display text-xl font-light mb-1">No Mood Data Yet</h3>
        <p className="text-muted text-xs max-w-sm mb-5 leading-relaxed">
          Log your daily reflections to see your emotional trajectory and mood patterns visualized here.
        </p>
        <button
          onClick={() => navigate("/journals/new")}
          className="px-5 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
        >
          + Write a Reflection
        </button>
      </div>
    );
  }

  const max = 10;
  const values = moodDaily;
  const labels = moodLabels.length > 0 ? moodLabels : values.map((_, i) => `D${i + 1}`);

  const w = values.length > 1 ? 100 / (values.length - 1) : 100;
  const pts = values
    .map((v, i) => `${i * w},${100 - (Math.min(10, Math.max(1, v)) / max) * 85}`)
    .join(" ");

  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const [hover, setHover] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">
            AVG MOOD
          </p>
          <p className="font-display text-4xl text-violet-light">
            {avg}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted font-mono text-xs tracking-widest uppercase">
            TREND
          </p>
          <p className="font-display text-2xl text-green">
            {Number(avg) >= 7 ? "↑ Positive" : "→ Steady"}
          </p>
        </div>
      </div>

      <div className="relative h-48">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="at-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[2, 4, 6, 8, 10].map((v) => (
            <line
              key={v}
              x1="0"
              y1={100 - (v / max) * 85}
              x2="100"
              y2={100 - (v / max) * 85}
              stroke="#252640"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <polyline
            points={`${pts} ${(values.length - 1) * w},100 0,100`}
            fill="url(#at-grad)"
            stroke="none"
          />
          <polyline
            points={pts}
            fill="none"
            stroke="#7c6af7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {values.map((v, i) => (
            <circle
              key={i}
              cx={i * w}
              cy={100 - (Math.min(10, Math.max(1, v)) / max) * 85}
              r={hover === i ? 4 : 2.5}
              fill={hover === i ? "#a49af9" : "#7c6af7"}
              className="cursor-pointer transition-all"
              vectorEffect="non-scaling-stroke"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        {hover !== null && (
          <div
            className="absolute -top-8 px-2 py-1 rounded-lg bg-violet text-white text-xs font-mono pointer-events-none"
            style={{
              left: `calc(${hover * (100 / Math.max(1, values.length - 1))}% - 16px)`,
            }}
          >
            {values[hover]}/10
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2">
        {labels
          .filter((_, i) => i % Math.max(1, Math.floor(labels.length / 6)) === 0)
          .slice(0, 6)
          .map((l, idx) => (
            <span key={idx} className="text-[10px] text-muted font-mono">
              {l}
            </span>
          ))}
      </div>
    </div>
  );
}

function MoodMapChart({ moodGrid = [], onInsightClick, hasData, navigate }) {
  if (!hasData || moodGrid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <span className="text-3xl mb-3 text-violet-light">◈</span>
        <h3 className="font-display text-xl font-light mb-1">No Mood Map Data</h3>
        <p className="text-muted text-xs max-w-sm mb-5 leading-relaxed">
          Your emotional heatmap will reveal when you feel your best as you record entries at different times of day.
        </p>
        <button
          onClick={() => navigate("/journals/new")}
          className="px-5 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
        >
          + Write an Entry
        </button>
      </div>
    );
  }

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOURS = ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"];

  const colorFor = (v) => {
    if (v >= 8) return "#7c6af7";
    if (v >= 6) return "#5b4bc4";
    if (v >= 4) return "#2d2850";
    return "#1a1b2e";
  };

  return (
    <div>
      <p className="text-ink-dim text-sm mb-6">
        Your emotional heatmap — when you feel your best and when you struggle.{" "}
        <button
          type="button"
          onClick={onInsightClick}
          className="text-violet-light hover:underline font-medium cursor-pointer"
        >
          View insights →
        </button>
      </p>
      <div className="flex gap-3">
        <div className="flex flex-col justify-around pt-4">
          {HOURS.map((h) => (
            <span
              key={h}
              className="text-[10px] text-muted font-mono text-right w-8"
            >
              {h}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex gap-1 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex-1 text-center text-[10px] text-muted font-mono"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {moodGrid.map((week, wi) => (
              <div key={wi} className="flex-1 flex flex-col gap-1">
                {week.map((val, di) => (
                  <button
                    key={di}
                    type="button"
                    onClick={onInsightClick}
                    title={`Mood: ${val}/10`}
                    className="aspect-square rounded-sm hover:ring-1 hover:ring-violet/60 transition-all cursor-pointer"
                    style={{ background: colorFor(val) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        <span className="text-[10px] text-muted font-mono">Low</span>
        {["#1a1b2e", "#2d2850", "#5b4bc4", "#7c6af7", "#a49af9"].map((c) => (
          <div
            key={c}
            className="w-4 h-4 rounded-sm"
            style={{ background: c }}
          />
        ))}
        <span className="text-[10px] text-muted font-mono">High</span>
      </div>
    </div>
  );
}

function GrowthMetricsChart({ growthData = [], hasData, navigate }) {
  if (!hasData || growthData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <span className="text-3xl mb-3 text-violet-light">🌱</span>
        <h3 className="font-display text-xl font-light mb-1">No Growth Metrics Yet</h3>
        <p className="text-muted text-xs max-w-sm mb-5 leading-relaxed">
          Growth scores in Mindfulness, Consistency, and Self-awareness calculate automatically from your reflections.
        </p>
        <button
          onClick={() => navigate("/journals/new")}
          className="px-5 py-2 rounded-full bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-all shadow-md shadow-violet/20 cursor-pointer"
        >
          + Record First Reflection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {growthData.map((g) => {
        const latest = g.scores[g.scores.length - 1];
        const prev = g.scores[0];
        const delta = latest - prev;
        const w = 100 / Math.max(1, g.scores.length - 1);
        const pts = g.scores
          .map((v, i) => `${i * w},${100 - (v / 100) * 90}`)
          .join(" ");
        return (
          <div
            key={g.category}
            className="p-4 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ background: g.color }}
                />
                <div>
                  <p className="text-sm font-medium">{g.category}</p>
                  <p className="text-muted text-xs font-mono">
                    {delta >= 0 ? `+${delta}` : delta}pts progression
                  </p>
                </div>
              </div>
              <p className="font-display text-2xl" style={{ color: g.color }}>
                {latest}%
              </p>
            </div>
            <div className="h-10">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <polyline
                  points={pts}
                  fill="none"
                  stroke={g.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsSuite({ navigate: propNavigate }) {
  const [tab, setTab] = useState("trends");
  const [showInsights, setShowInsights] = useState(false);

  const routerNavigate = useNavigate();
  const {
    journals,
    loading,
    growthData,
    hasData,
    moodDaily,
    moodLabels,
    moodGrid,
    emotionBreakdown,
    stats,
    fetchAnalyticsData,
  } = useAnalytics();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  // Listen for journal deletions across the app to re-fetch/re-sync
  useEffect(() => {
    const handleJournalDeleted = () => {
      fetchAnalyticsData(true);
    };

    window.addEventListener("aura_journal_deleted", handleJournalDeleted);
    return () => {
      window.removeEventListener("aura_journal_deleted", handleJournalDeleted);
    };
  }, [fetchAnalyticsData]);

  const TABS = [
    { id: "trends", label: "Mood Trends" },
    { id: "moodmap", label: "Mood Map" },
    { id: "growth", label: "Growth Metrics" },
  ];

  return (
    <>
      <InsightsModal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        userJournals={journals}
      />

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
            <div>
              <p className="text-muted font-mono text-xs tracking-widest uppercase">
                ANALYTICS SUITE
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInsights(true)}
            className="px-5 py-2 rounded-full border border-violet/30 bg-violet-glow text-violet-light text-sm hover:border-violet/50 transition-colors shadow-lg shadow-violet/10 cursor-pointer"
          >
            ✦ AI Insights
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-none flex items-center gap-1 px-6 md:px-8 pt-6 pb-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-violet text-white shadow-md shadow-violet/20"
                  : "text-muted-light hover:text-ink hover:bg-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-12 gap-5">
              {/* Main Chart Card */}
              <div className="col-span-12 md:col-span-8 p-6 rounded-2xl border border-border bg-card min-h-[340px] flex flex-col justify-center">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
                    <p className="text-muted text-xs font-mono animate-pulse">
                      Loading your analytics metrics…
                    </p>
                  </div>
                ) : (
                  <>
                    {tab === "trends" && (
                      <MoodTrendsChart
                        moodDaily={moodDaily}
                        moodLabels={moodLabels}
                        navigate={navigate}
                      />
                    )}
                    {tab === "moodmap" && (
                      <MoodMapChart
                        moodGrid={moodGrid}
                        hasData={hasData}
                        onInsightClick={() => setShowInsights(true)}
                        navigate={navigate}
                      />
                    )}
                    {tab === "growth" && (
                      <GrowthMetricsChart
                        growthData={growthData}
                        hasData={hasData}
                        navigate={navigate}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Side Stats */}
              <div className="col-span-12 md:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <p className="text-muted font-mono text-xs tracking-widest uppercase mb-2">
                    YOUR ACTIVITY
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Entries written",
                        val: stats.entriesWritten,
                        color: "text-violet-light",
                      },
                      {
                        label: "Avg mood score",
                        val: stats.avgMood,
                        color: "text-green",
                      },
                      {
                        label: "Current streak",
                        val: stats.currentStreak,
                        color: "text-amber",
                      },
                      {
                        label: "Voice notes",
                        val: stats.voiceNotes,
                        color: "text-rose",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted text-xs font-mono">
                          {s.label}
                        </span>
                        <span
                          className={`font-display text-base ${s.color}`}
                        >
                          {s.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card">
                  <p className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
                    EMOTION BREAKDOWN
                  </p>
                  {!hasData || emotionBreakdown.length === 0 ? (
                    <p className="text-muted text-xs font-mono py-2">
                      No emotions recorded yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {emotionBreakdown.map((e) => (
                        <div key={e.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span>{e.emoji}</span>
                              <span className="text-ink-dim">{e.label}</span>
                            </div>
                            <span className="text-muted font-mono">
                              {e.pct}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-surface overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet"
                              style={{
                                width: `${e.pct}%`,
                                opacity: 0.4 + e.pct / 100,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowInsights(true)}
                  className="w-full p-5 rounded-2xl border border-violet/20 bg-violet-glow hover:border-violet/30 transition-colors text-left group cursor-pointer"
                >
                  <p className="text-violet-light text-sm font-medium mb-1 group-hover:underline">
                    ✦ AI Insights
                  </p>
                  <p className="text-muted text-xs leading-relaxed">
                    Explore dynamic pattern detections & transparency notes from Gemini.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
