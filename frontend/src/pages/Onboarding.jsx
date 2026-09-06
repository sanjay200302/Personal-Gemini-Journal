import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = ["Welcome", "Features", "Analytics", "Account"];

function ProgressStepper({ step }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                i < step
                  ? "bg-violet text-white"
                  : i === step
                  ? "border-2 border-violet text-violet-light bg-violet-glow"
                  : "border border-border text-muted"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-[10px] font-mono tracking-wide hidden md:block ${
                i === step ? "text-violet-light font-bold" : "text-muted"
              }`}
            >
              {label.toUpperCase()}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="w-16 h-px transition-all duration-500 mb-4"
              style={{ background: i < step ? "#7c6af7" : "#252640" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center animate-fade-up">
      <div className="relative mx-auto w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full bg-violet opacity-20 blur-2xl animate-pulse" />
        <div className="relative w-32 h-32 rounded-full border-2 border-violet/30 flex items-center justify-center bg-violet-glow">
          <div className="w-16 h-16 rounded-full bg-violet/80 flex items-center justify-center text-2xl">
            ✦
          </div>
        </div>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-light mb-4">
        Welcome to <em className="text-violet-light not-italic">Aura</em>
      </h1>
      <p className="text-ink-dim text-lg leading-relaxed max-w-md mx-auto">
        Your personal sanctuary for journaling, growth, and self-discovery. We'll
        get you set up in just a few steps.
      </p>
      <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-green">✓</span> Free forever
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green">✓</span> End-to-end encrypted
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green">✓</span> No ads
        </div>
      </div>
    </div>
  );
}

function FeatureTourStep() {
  const [active, setActive] = useState(0);
  const features = [
    {
      icon: "✦",
      color: "text-violet-light",
      title: "Mindful Journaling",
      desc: "Write freely with AI prompts that adapt to your emotional state. Voice memos, emoji moods, and rich text — all in one space.",
    },
    {
      icon: "◈",
      color: "text-amber",
      title: "Mood & Growth Analytics",
      desc: "See your emotional patterns over days, weeks, and months. Identify triggers, celebrate wins, and understand yourself better.",
    },
    {
      icon: "⬡",
      color: "text-rose",
      title: "Growth Capsules",
      desc: "Time-lock letters to your future self. Unlock them when you hit personal milestones — a reward for showing up.",
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-muted font-mono text-xs tracking-widest uppercase mb-2">
          WHAT AWAITS YOU
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-light">
          Built for growth
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {features.map((f, i) => (
          <button
            key={f.title}
            onClick={() => setActive(i)}
            className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
              active === i
                ? "border-violet/40 bg-violet-glow"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className={`text-xl mb-2 font-mono ${f.color}`}>{f.icon}</div>
            <div className="text-xs sm:text-sm font-medium truncate">{f.title}</div>
          </button>
        ))}
      </div>
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className={`text-2xl mb-3 font-mono ${features[active].color}`}>
          {features[active].icon}
        </div>
        <h3 className="font-display text-2xl mb-2">
          {features[active].title}
        </h3>
        <p className="text-ink-dim leading-relaxed text-sm sm:text-base">
          {features[active].desc}
        </p>
      </div>
    </div>
  );
}

function AnalyticsStep() {
  const moodData = [4, 6, 5, 8, 7, 9, 8];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = 10;
  const w = 100 / (moodData.length - 1);
  const points = moodData
    .map((v, i) => `${i * w},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-muted font-mono text-xs tracking-widest uppercase mb-2">
          YOUR GROWTH SPACE
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-light">
          Insights at a glance
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted font-mono text-xs tracking-widest uppercase">
                MOOD TREND — LAST 7 DAYS
              </p>
              <p className="font-display text-xl sm:text-2xl mt-1">
                Trending <span className="text-green">upward</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-display text-violet-light">
                8.0
              </p>
              <p className="text-muted text-xs font-mono">avg mood</p>
            </div>
          </div>
          <svg
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            className="w-full h-24"
          >
            <defs>
              <linearGradient id="onb-mood-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={`${points} ${(moodData.length - 1) * w},100 0,100`}
              fill="url(#onb-mood-grad)"
              stroke="none"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#7c6af7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {moodData.map((v, i) => (
              <circle
                key={i}
                cx={i * w}
                cy={100 - (v / max) * 100}
                r="3"
                fill="#7c6af7"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="flex justify-between mt-1">
            {days.map((d) => (
              <span key={d} className="text-[10px] text-muted font-mono">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
            STREAK
          </p>
          <p className="font-display text-4xl text-amber">12</p>
          <p className="text-ink-dim text-sm mt-1">days in a row 🔥</p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
            ENTRIES
          </p>
          <p className="font-display text-4xl text-violet-light">47</p>
          <p className="text-ink-dim text-sm mt-1">total journals</p>
        </div>
      </div>
    </div>
  );
}

function AccountRedirectStep({ onProceed }) {
  return (
    <div className="text-center animate-fade-up">
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-violet opacity-30 blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full border-2 border-violet/40 flex items-center justify-center bg-violet-glow text-3xl">
          ✨
        </div>
      </div>
      <p className="text-muted font-mono text-xs tracking-widest uppercase mb-2">
        STEP 4 OF 4 · ACCOUNT
      </p>
      <h2 className="font-display text-3xl sm:text-4xl font-light mb-3">
        Create your account
      </h2>
      <p className="text-ink-dim text-base max-w-sm mx-auto mb-8">
        Your growth workspace is ready. Let's set up your secure credentials to start journaling.
      </p>
      <button
        type="button"
        onClick={onProceed}
        className="px-8 py-3.5 rounded-full bg-violet text-white font-medium hover:bg-violet-dim transition-all text-sm shadow-lg shadow-violet/20"
      >
        Continue to Sign Up →
      </button>
    </div>
  );
}

export default function Onboarding({ navigate: propNavigate }) {
  const [step, setStep] = useState(0);

  const routerNavigate = useNavigate();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  const next = () => {
    if (step === 2) {
      // Step 2 is Analytics: advance to Account (step 3) and route to signup
      setStep(3);
      setTimeout(() => {
        navigate("signup");
      }, 400);
    } else if (step === 3) {
      navigate("signup");
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="h-full min-h-screen bg-ground text-ink flex flex-col">
      {/* Top progress header */}
      <div className="flex-none px-6 md:px-8 py-6 border-b border-border">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-violet" />
            <span className="font-display text-sm">Aura</span>
          </div>
          <ProgressStepper step={step} />
          <button
            onClick={() => navigate("signup")}
            className="text-xs text-muted hover:text-ink transition-colors font-mono"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center py-10 px-6 md:px-8">
        <div className="w-full max-w-xl">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <FeatureTourStep />}
          {step === 2 && <AnalyticsStep />}
          {step === 3 && <AccountRedirectStep onProceed={() => navigate("signup")} />}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-none px-6 md:px-8 py-6 border-t border-border">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`text-sm text-muted hover:text-ink transition-colors ${
              step === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background:
                    i === step ? "#7c6af7" : i < step ? "#a49af9" : "#252640",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="px-8 py-2.5 rounded-full bg-violet text-white text-sm font-medium hover:bg-violet-dim transition-all shadow-lg shadow-violet/20 cursor-pointer"
          >
            {step === 2 ? "Continue to Account →" : step === 3 ? "Go to Sign Up →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
