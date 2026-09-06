import { useTheme as useThemeFromContext } from "../context/ThemeContext.jsx";

export function useTheme() {
  return useThemeFromContext();
}

export default useTheme;
