export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon = null,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

  const sizeClasses = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-9 py-3.5 text-sm md:text-base",
  }[size] || "px-6 py-2.5 text-sm";

  const variantClasses = {
    primary:
      "bg-violet text-white hover:bg-violet-dim hover:scale-[1.02] shadow-lg shadow-violet/20 active:scale-[0.98]",
    secondary:
      "border border-border bg-card text-ink hover:bg-surface hover:border-violet/30 active:scale-[0.98]",
    rose:
      "bg-gradient-to-r from-[#e879a0] to-[#c4507a] text-white hover:opacity-90 shadow-lg shadow-rose/20 active:scale-[0.98]",
    ghost:
      "text-muted-light hover:text-ink hover:bg-surface/50 border border-transparent",
    danger:
      "bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20 active:scale-[0.98]",
    success:
      "bg-green/20 text-green border border-green/30 hover:bg-green/30",
  }[variant] || "bg-violet text-white hover:bg-violet-dim";

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{typeof children === "string" ? "Loading…" : children}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <span className="flex-none">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
}
