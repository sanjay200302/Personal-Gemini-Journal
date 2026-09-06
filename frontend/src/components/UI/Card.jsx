export default function Card({
  children,
  className = "",
  hoverEffect = false,
  glow = false,
  variant = "default",
  onClick,
  ...props
}) {
  const variantClasses = {
    default: "bg-card border-border",
    surface: "bg-surface border-border",
    glow: "bg-card border-violet/20 bg-violet-glow",
    rose: "bg-gradient-to-r from-rose/5 to-transparent border-rose/20",
  }[variant] || "bg-card border-border";

  const hoverClasses = hoverEffect
    ? "hover:border-violet/30 hover:bg-card-hover transition-all cursor-pointer"
    : "transition-colors";

  const glowClass = glow ? "aura-glow" : "";

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border ${variantClasses} ${hoverClasses} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
