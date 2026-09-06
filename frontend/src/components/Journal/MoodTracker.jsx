import { useState } from "react";

const DEFAULT_WEEK = [6, 7, 5, 8, 9, 8, 9];
const DEFAULT_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function MoodSparkline({ data = DEFAULT_WEEK, max = 10, strokeColor = "#7c6af7" }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const w = 100 / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${i * w},${100 - (v / max) * 90}`).join(" ");

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="w-full h-16 overflow-visible"
      >
        <defs>
          <linearGradient id="mood-spark-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`${pts} ${(data.length - 1) * w},100 0,100`}
          fill="url(#mood-spark-g)"
          stroke="none"
        />
        <polyline
          points={pts}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((v, i) => (
          <circle
            key={i}
            cx={i * w}
            cy={100 - (v / max) * 90}
            r={hoverIndex === i ? 4.5 : i === data.length - 1 ? 3.5 : 2.5}
            fill={hoverIndex === i ? "#a49af9" : strokeColor}
            className="cursor-pointer transition-all"
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>
      {hoverIndex !== null && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded bg-violet text-white text-[10px] font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: `${hoverIndex * w}%` }}
        >
          {data[hoverIndex]}/10
        </div>
      )}
    </div>
  );
}

export default function MoodTracker({
  data = DEFAULT_WEEK,
  days = DEFAULT_DAYS,
  trendPercentage = "+18%",
  title = "This Week",
  onClick,
  className = "",
}) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border border-border bg-card ${
        onClick ? "cursor-pointer hover:border-violet/30 transition-colors" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">
            MOOD TREND
          </p>
          <p className="font-display text-xl mt-0.5">{title}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-violet-light">
            ↑ {trendPercentage}
          </p>
          <p className="text-muted text-xs font-mono">vs last week</p>
        </div>
      </div>

      <MoodSparkline data={data} />

      <div className="flex justify-between mt-1">
        {days.map((d, i) => (
          <span key={i} className="text-[10px] text-muted font-mono">
            {d}
          </span>
        ))}
      </div>

      {onClick && (
        <p className="text-xs text-muted mt-3 font-mono">
          Click to explore analytics →
        </p>
      )}
    </div>
  );
}
