'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Theme Context
// Manages light/dark mode AND primary/accent color presets with localStorage.
// When Supabase auth is wired up, migrate themeColor to a profile field.
// ──────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';

export type ThemeColor = 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber' | 'teal';

interface ColorValues {
  light: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    accent: string;
    accentHover: string;
    accentLight: string;
    shadowGlow: string;
  };
  dark: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    accent: string;
    accentHover: string;
    accentLight: string;
    shadowGlow: string;
  };
}

// ── Color Palette Presets ─────────────────────────────────────────────────────

export const COLOR_PRESETS: Record<ThemeColor, { label: string; gradient: string; values: ColorValues }> = {
  indigo: {
    label: 'Indigo',
    gradient: 'from-indigo-500 to-violet-400',
    values: {
      light: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        primaryLight: '#e0e7ff',
        accent: '#10b981',
        accentHover: '#059669',
        accentLight: '#d1fae5',
        shadowGlow: '0 0 20px rgba(99, 102, 241, 0.15)',
      },
      dark: {
        primary: '#818cf8',
        primaryHover: '#6366f1',
        primaryLight: 'rgba(99, 102, 241, 0.15)',
        accent: '#34d399',
        accentHover: '#10b981',
        accentLight: 'rgba(16, 185, 129, 0.15)',
        shadowGlow: '0 0 20px rgba(129, 140, 248, 0.2)',
      },
    },
  },
  emerald: {
    label: 'Emerald',
    gradient: 'from-emerald-500 to-teal-400',
    values: {
      light: {
        primary: '#10b981',
        primaryHover: '#059669',
        primaryLight: '#d1fae5',
        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentLight: '#e0e7ff',
        shadowGlow: '0 0 20px rgba(16, 185, 129, 0.15)',
      },
      dark: {
        primary: '#34d399',
        primaryHover: '#10b981',
        primaryLight: 'rgba(16, 185, 129, 0.15)',
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        shadowGlow: '0 0 20px rgba(52, 211, 153, 0.2)',
      },
    },
  },
  sky: {
    label: 'Sky',
    gradient: 'from-sky-500 to-cyan-400',
    values: {
      light: {
        primary: '#0ea5e9',
        primaryHover: '#0284c7',
        primaryLight: '#e0f2fe',
        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentLight: '#e0e7ff',
        shadowGlow: '0 0 20px rgba(14, 165, 233, 0.15)',
      },
      dark: {
        primary: '#38bdf8',
        primaryHover: '#0ea5e9',
        primaryLight: 'rgba(14, 165, 233, 0.15)',
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        shadowGlow: '0 0 20px rgba(56, 189, 248, 0.2)',
      },
    },
  },
  rose: {
    label: 'Rose',
    gradient: 'from-rose-500 to-pink-400',
    values: {
      light: {
        primary: '#f43f5e',
        primaryHover: '#e11d48',
        primaryLight: '#ffe4e6',
        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentLight: '#e0e7ff',
        shadowGlow: '0 0 20px rgba(244, 63, 94, 0.15)',
      },
      dark: {
        primary: '#fb7185',
        primaryHover: '#f43f5e',
        primaryLight: 'rgba(244, 63, 94, 0.15)',
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        shadowGlow: '0 0 20px rgba(251, 113, 133, 0.2)',
      },
    },
  },
  amber: {
    label: 'Amber',
    gradient: 'from-amber-500 to-orange-400',
    values: {
      light: {
        primary: '#f59e0b',
        primaryHover: '#d97706',
        primaryLight: '#fef3c7',
        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentLight: '#e0e7ff',
        shadowGlow: '0 0 20px rgba(245, 158, 11, 0.15)',
      },
      dark: {
        primary: '#fbbf24',
        primaryHover: '#f59e0b',
        primaryLight: 'rgba(245, 158, 11, 0.15)',
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        shadowGlow: '0 0 20px rgba(251, 191, 36, 0.2)',
      },
    },
  },
  teal: {
    label: 'Teal',
    gradient: 'from-teal-500 to-cyan-400',
    values: {
      light: {
        primary: '#14b8a6',
        primaryHover: '#0d9488',
        primaryLight: '#ccfbf1',
        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentLight: '#e0e7ff',
        shadowGlow: '0 0 20px rgba(20, 184, 166, 0.15)',
      },
      dark: {
        primary: '#2dd4bf',
        primaryHover: '#14b8a6',
        primaryLight: 'rgba(20, 184, 166, 0.15)',
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        shadowGlow: '0 0 20px rgba(45, 212, 191, 0.2)',
      },
    },
  },
};

// ── Context Interface ─────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'ants-theme';
const COLOR_STORAGE_KEY = 'ants-theme-color';

// ── Helper: apply color CSS vars to root ─────────────────────────────────────

function applyColorVars(color: ThemeColor, theme: Theme) {
  const root = document.documentElement;
  const vals = COLOR_PRESETS[color].values[theme];
  root.style.setProperty('--primary', vals.primary);
  root.style.setProperty('--primary-hover', vals.primaryHover);
  root.style.setProperty('--primary-light', vals.primaryLight);
  root.style.setProperty('--accent', vals.accent);
  root.style.setProperty('--accent-hover', vals.accentHover);
  root.style.setProperty('--accent-light', vals.accentLight);
  root.style.setProperty('--shadow-glow', vals.shadowGlow);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('indigo');
  const [mounted, setMounted] = useState(false);

  // Initialize theme and color from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const storedColor = localStorage.getItem(COLOR_STORAGE_KEY) as ThemeColor | null;

    const resolvedTheme: Theme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    const resolvedColor: ThemeColor =
      storedColor && storedColor in COLOR_PRESETS ? storedColor : 'indigo';

    setThemeState(resolvedTheme);
    setThemeColorState(resolvedColor);
    setMounted(true);
  }, []);

  // Apply theme attribute + color vars whenever either changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyColorVars(themeColor, theme);
  }, [theme, themeColor, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setThemeColor = useCallback((color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem(COLOR_STORAGE_KEY, color);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme, themeColor: 'indigo', setThemeColor }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
