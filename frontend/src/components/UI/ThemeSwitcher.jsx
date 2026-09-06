import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeSwitcher({
  variant = "icon",
  darkMode: customDarkMode,
  setDarkMode: customSetDarkMode,
  className = "",
}) {
  const { darkMode: ctxDarkMode, toggleTheme: ctxToggleTheme, setDarkMode: ctxSetDarkMode } = useTheme();

  const darkMode = customDarkMode !== undefined ? customDarkMode : ctxDarkMode;
  const toggle = () => {
    if (customSetDarkMode) {
      customSetDarkMode(!darkMode);
    } else if (ctxToggleTheme) {
      ctxToggleTheme();
    } else if (ctxSetDarkMode) {
      ctxSetDarkMode(!darkMode);
    }
  };

  if (variant === "toggle") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
          darkMode ? "bg-violet" : "bg-border"
        } ${className}`}
        aria-label="Toggle light/dark theme"
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
            darkMode ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-9 h-9 rounded-full border border-border bg-card hover:bg-card-hover transition-colors flex items-center justify-center text-sm focus:outline-none ${className}`}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light/dark theme"
    >
      {darkMode ? "☀" : "◗"}
    </button>
  );
}
