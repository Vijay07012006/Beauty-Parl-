'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-secondary/20 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="p-2.5 rounded-full hover:bg-secondary/50 active:scale-95 transition-all duration-300 cursor-pointer text-foreground flex items-center justify-center border border-border/30 shadow-sm"
    >
      {isDark ? (
        <Sun size={18} className="text-amber-500 transition-transform hover:rotate-45 duration-500" />
      ) : (
        <Moon size={18} className="text-slate-700 transition-transform hover:-rotate-12 duration-500" />
      )}
    </button>
  );
}
