'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sv-theme';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' ? 'light' : 'dark';
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={mounted ? theme === 'light' : undefined}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-button-border bg-button-bg text-ink shadow-card transition-colors duration-fast ease-out hover:bg-surface-2',
        className
      )}
    >
      {mounted && theme === 'dark' ? (
        <Sun size={14} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Moon size={14} strokeWidth={1.5} aria-hidden="true" />
      )}
    </button>
  );
}
