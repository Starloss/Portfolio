import React, { createContext, use, useEffect, useRef, useState, useCallback } from 'react';
import { uiDelayMs } from '../app/scene/prototype-boveda/store';

interface ThemeContextValue {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = window.localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {
        /* ignore */
    }
    if (typeof window.matchMedia !== 'function') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

    const firstTheme = useRef(true);
    useEffect(() => {
        const root = document.documentElement;
        const apply = () => {
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };
        // PROTOTIPO: la UI puede cambiar a la mitad o al final de la Bóveda celeste.
        const wait = firstTheme.current ? 0 : uiDelayMs();
        firstTheme.current = false;
        if (wait === 0) apply();
        const timer = wait === 0 ? undefined : window.setTimeout(apply, wait);
        try {
            window.localStorage.setItem('theme', theme);
        } catch {
            /* ignore */
        }
        return () => window.clearTimeout(timer);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
};

export function useTheme() {
    const ctx = use(ThemeContext);
    if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
    return ctx;
}
