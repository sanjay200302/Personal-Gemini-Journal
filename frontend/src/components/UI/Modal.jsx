import { useEffect } from "react";

export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[maxWidth] || "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full ${maxWidthClasses} p-8 rounded-2xl border border-border bg-card text-ink animate-fade-up shadow-2xl relative ${className}`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between mb-6">
            <div>
              {subtitle && (
                <p className="text-muted font-mono text-xs tracking-widest uppercase mb-1">
                  {subtitle}
                </p>
              )}
              {title && (
                <h2 className="font-display text-2xl font-light text-ink">
                  {title}
                </h2>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink hover:border-violet/40 transition-colors text-lg"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
