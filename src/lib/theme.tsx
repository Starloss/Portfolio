import React, { createContext, use, useEffect, useRef, useState, useCallback } from 'react';
import { BOVEDA_SECONDS } from '@app/scene/vault';
import { trackTemaElegido } from '@lib/analytics';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const CHOICE_KEY = 'tema-elegido';

// El script inline de index.html pone el tema antes del primer pintado y anota en <html> cuál
// corresponde a la hora de Caracas al cargar, y si esa hora está forzada; aquí solo se lee (docs/adr/0004).
const getInitialTheme = (): Theme =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light';

/** Guarda la elección de esta visita; volver al tema de la hora la borra, y no se cuenta. */
function rememberChoice(theme: Theme) {
    const { temaHora, horaForzada } = document.documentElement.dataset;
    const matchesHour = theme === temaHora;
    try {
        if (matchesHour) window.sessionStorage.removeItem(CHOICE_KEY);
        else window.sessionStorage.setItem(CHOICE_KEY, theme);
    } catch {
        /* ignore */
    }
    // Una hora forzada es una prueba o una demostración: no se cuenta.
    if (!matchesHour && horaForzada === undefined) trackTemaElegido(theme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // La Escena gira enseguida; la UI cambia a la mitad de la Bóveda celeste. Sin giro, enseguida.
    const appliedRef = useRef(theme);
    useEffect(() => {
        if (appliedRef.current === theme) return;
        appliedRef.current = theme;
        const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            apply();
            return;
        }
        const timer = window.setTimeout(apply, (BOVEDA_SECONDS * 1000) / 2);
        return () => window.clearTimeout(timer);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        rememberChoice(next);
    }, [theme]);

    return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
};

export function useTheme() {
    const ctx = use(ThemeContext);
    if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
    return ctx;
}
