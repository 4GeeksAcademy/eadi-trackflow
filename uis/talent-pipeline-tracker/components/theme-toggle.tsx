"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tp-theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme ? savedTheme === "dark" : prefersDark;
  });

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const onToggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    applyTheme(nextIsDark);
    localStorage.setItem(STORAGE_KEY, nextIsDark ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isDark ? "bg-indigo-400" : "bg-amber-400"
        }`}
        aria-hidden="true"
      />
      {isDark ? "Oscuro" : "Claro"}
    </button>
  );
}