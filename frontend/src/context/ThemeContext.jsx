import { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_theme");
      if (saved) return saved;
      const legacyDark = localStorage.getItem("aura_dark_mode");
      if (legacyDark !== null) {
        return JSON.parse(legacyDark) ? "dark" : "light";
      }
    } catch {}
    return "dark";
  });

  const [moodTheme, setMoodTheme] = useState("default");

  const darkMode = theme === "dark";

  const setTheme = (newTheme) => {
    const targetTheme = typeof newTheme === "function" ? newTheme(theme) : newTheme;
    setThemeState(targetTheme);
  };

  const setDarkMode = (isDark) => {
    const nextDark = typeof isDark === "function" ? isDark(darkMode) : isDark;
    setTheme(nextDark ? "dark" : "light");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    try {
      localStorage.setItem("aura_theme", theme);
      localStorage.setItem("aura_dark_mode", JSON.stringify(theme === "dark"));
    } catch {}

    // Apply data-theme to root html element and body
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light-mode", "light");
      document.body.classList.add("dark");
      document.body.classList.remove("light-mode", "light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light-mode", "light");
      document.body.classList.remove("dark");
      document.body.classList.add("light-mode", "light");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        darkMode,
        setDarkMode,
        toggleTheme,
        moodTheme,
        setMoodTheme,
      }}
    >
      <div
        data-theme={theme}
        className={`w-full min-h-screen ${
          darkMode ? "" : "light-mode light"
        } ${moodTheme !== "default" ? `theme-${moodTheme}` : ""}`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;
