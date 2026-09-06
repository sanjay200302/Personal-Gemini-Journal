import { useNavigate } from "react-router-dom";

export default function Home({ navigate: propNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  return (
    <div
      style={{ backgroundColor: "#0a0b14", color: "#e2ddd4", minHeight: "100vh" }}
      className="w-full min-h-screen bg-[#0a0b14] text-[#e2ddd4] bg-ground text-ink overflow-y-auto"
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 border-b border-border bg-ground/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="Aura"
            className="w-8 h-8"
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            Aura
          </span>
        </div>
        <div className="flex items-center gap-5 md:gap-7 text-sm text-muted-light">
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink transition-colors hidden sm:inline"
          >
            Docs
          </a>
          <button
            onClick={() => navigate("auth")}
            className="px-5 py-2 rounded-full border border-border hover:bg-surface hover:border-violet/30 transition-colors text-ink text-sm cursor-pointer"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-28 pb-20 md:pb-24 px-6 md:px-8 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet opacity-[0.07] blur-[80px] pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-violet-light opacity-[0.06] blur-[60px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet/25 bg-violet-glow text-violet-light text-xs font-mono mb-8 tracking-wide">
            <span
              className="w-1.5 h-1.5 rounded-full bg-violet-light animate-ping"
            />
            Open beta — free to join
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-[80px] font-light leading-[0.95] tracking-tight mb-6">
            Mindful Journaling &amp; Growth
            <br />
            <em className="text-violet-light not-italic aura-text-glow">Create Your Aura</em>
          </h1>

          <p className="text-ink-dim text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            A mindful space for journaling, emotional growth, and self-discovery.
            Track your inner landscape — unlock the person you're becoming.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("onboarding")}
              className="px-9 py-3.5 rounded-full bg-violet text-white font-medium hover:bg-violet-dim transition-all hover:scale-[1.02] shadow-lg shadow-violet/20 text-sm cursor-pointer"
            >
              Create Your Aura →
            </button>
            <button
              onClick={() => navigate("auth")}
              className="px-9 py-3.5 rounded-full border border-border text-ink hover:bg-surface transition-colors text-sm cursor-pointer"
            >
              Sign in
            </button>
          </div>

          {/* Dashboard Preview Sketch */}
          <div className="mt-16 mx-auto max-w-3xl rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
              <div className="w-2.5 h-2.5 rounded-full bg-rose/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green/60" />
              <div className="flex-1 mx-4 h-5 rounded bg-border/60 text-xs text-muted text-center leading-5 font-mono">
                app.aura.io/dashboard
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 p-4 h-44">
              <div className="col-span-3 sm:col-span-2 rounded-lg bg-surface border border-border flex flex-col gap-2.5 p-2 sm:p-3">
                {["Journals", "Analytics", "Growth", "Settings"].map((item) => (
                  <div
                    key={item}
                    className="h-4 rounded-sm bg-border/60 text-[9px] text-muted flex items-center px-1 truncate"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="col-span-9 sm:col-span-5 rounded-lg bg-surface border border-border p-3 flex flex-col gap-2">
                <div className="text-[9px] text-muted-light font-mono">
                  RECENT JOURNALS
                </div>
                {[
                  { title: "Morning reflection", emoji: "😊" },
                  { title: "Breakthrough moment", emoji: "🌟" },
                  { title: "Gratitude practice", emoji: "🙏" },
                ].map((j) => (
                  <div key={j.title} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-violet/20 text-[8px] flex items-center justify-center">
                      {j.emoji}
                    </div>
                    <div className="h-2 rounded flex-1 bg-border/80 text-[8px]" />
                  </div>
                ))}
              </div>
              <div className="hidden sm:block sm:col-span-5 rounded-lg bg-surface border border-border p-3">
                <div className="text-[9px] text-muted-light font-mono mb-2">
                  MOOD TREND
                </div>
                <svg
                  viewBox="0 0 100 40"
                  className="w-full h-24 overflow-visible"
                >
                  <polyline
                    points="0,28 16,20 32,24 48,12 64,16 80,8 96,14"
                    fill="none"
                    stroke="#7c6af7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="0,28 16,20 32,24 48,12 64,16 80,8 96,14"
                    fill="url(#landing-g)"
                    stroke="none"
                    strokeWidth="0"
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient id="landing-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c6af7" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-muted-light font-mono text-xs tracking-widest uppercase mb-3">
            WHAT YOU GET
          </p>
          <h2 className="font-display text-4xl font-light">
            Everything you need to grow
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              glyph: "✦",
              color: "text-violet-light",
              bg: "bg-violet-glow",
              title: "Intelligent Journaling",
              desc: "Context-aware prompts that adapt to your emotional state, writing patterns, and growth goals.",
            },
            {
              glyph: "◈",
              color: "text-amber",
              bg: "bg-amber/10",
              title: "Mood Analytics",
              desc: "Visualize your emotional landscape over time — patterns, triggers, and breakthroughs.",
            },
            {
              glyph: "⬡",
              color: "text-rose",
              bg: "bg-rose/10",
              title: "Growth Capsules",
              desc: "Time-lock messages to your future self. Unlock them as you hit milestones and earn badges.",
            },
            {
              glyph: "⊕",
              color: "text-green",
              bg: "bg-green/10",
              title: "Voice Journaling",
              desc: "Speak your thoughts freely. AI transcribes and extracts insights from your voice entries.",
            },
            {
              glyph: "◬",
              color: "text-violet-light",
              bg: "bg-violet-glow",
              title: "Streak Gamification",
              desc: "Build momentum with daily streaks, achievement badges, and personal growth milestones.",
            },
            {
              glyph: "⊞",
              color: "text-amber",
              bg: "bg-amber/10",
              title: "Privacy First",
              desc: "End-to-end encrypted. Your journal is yours — no ads, no mining, no compromises.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-border bg-card hover:border-violet/30 hover:bg-card-hover transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 ${f.color} text-lg font-mono group-hover:scale-110 transition-transform`}
              >
                {f.glyph}
              </div>
              <h3 className="font-display text-xl mb-2">{f.title}</h3>
              <p className="text-muted-light text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center p-12 rounded-3xl border border-violet/20 bg-violet-glow">
          <h2 className="font-display text-4xl font-light mb-4">
            Begin your journey
          </h2>
          <p className="text-muted-light mb-8">
            Join thousands building their inner life, one entry at a time.
          </p>
          <button
            onClick={() => navigate("onboarding")}
            className="px-9 py-3.5 rounded-full bg-violet text-white font-medium hover:bg-violet-dim transition-all text-sm shadow-lg shadow-violet/20 cursor-pointer"
          >
            Create Your Aura →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-muted text-sm flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-violet/60" />
            <span className="font-display text-ink-dim">Aura</span>
            <span className="text-border">·</span>
            <span className="text-muted text-xs font-mono">v1.0.0-beta</span>
          </div>
          <div className="flex gap-6 text-xs sm:text-sm">
            {["Docs", "Community", "Blog", "Privacy", "Terms"].map((l) => (
              <a
                key={l}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="hover:text-ink transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
