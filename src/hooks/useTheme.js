import { useState, useEffect } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState();

  useEffect(() => {
    // Пробуем получить сохраненную тему из localStorage
    const savedTheme = localStorage.getItem("app-theme");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = (e, forceTheme = null) => {
      const newTheme = forceTheme || (e.matches ? "dark" : "light");
      setTheme(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("app-theme", newTheme); // Сохраняем в localStorage
    };

    // Если есть сохраненная тема - используем её, иначе системную
    if (savedTheme) {
      updateTheme(mediaQuery, savedTheme);
    } else {
      updateTheme(mediaQuery);
    }

    mediaQuery.addEventListener("change", updateTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, []);

  // Функция для ручного переключения темы
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  return { theme, toggleTheme };
};
