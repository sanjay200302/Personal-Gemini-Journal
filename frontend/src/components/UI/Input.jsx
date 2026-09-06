export default function Input({
  label,
  error,
  helperText,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
  rightElement = null,
  className = "",
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor={inputId}
            className="block text-xs font-mono text-muted tracking-widest uppercase"
          >
            {label} {required && <span className="text-rose">*</span>}
          </label>
          {rightElement}
        </div>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 rounded-xl bg-surface border ${
          error ? "border-rose/60 focus:border-rose" : "border-border focus:border-violet/60"
        } text-ink placeholder-muted focus:outline-none transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose mt-1.5 font-mono">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-muted mt-1.5">{helperText}</p>
      )}
    </div>
  );
}
