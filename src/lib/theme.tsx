import React, { createContext, use, useEffect, useState, useCallback } from 'react';
import { trackTemaElegido } from '@lib/analytics';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// El script inline de index.html pone el tema antes del primer pintado y anota en <html> cuál
// corresponde a la hora de Caracas; aquí solo se lee (docs/adr/0004).
const CHOICE_KEY = 'tema-elegido';

const getInitialTheme = (): Theme =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// Una URL con hora o Clima forzados es una prueba o una demostración: no se cuenta.
const isForced = () => {
    const query = new URLSearchParams(window.location.search);
    return query.has('hora') || query.has('clima');
};

/** Guarda la elección de esta visita; volver al tema de la hora la borra, y no se cuenta. */
function rememberChoice(theme: Theme) {
    const matchesHour = theme === document.documentElement.dataset.temaHora;
    try {
        if (matchesHour) window.sessionStorage.removeItem(CHOICE_KEY);
        else window.sessionStorage.setItem(CHOICE_KEY, theme);
    } catch {
        /* ignore */
    }
    if (!matchesHour && !isForced()) trackTemaElegido(theme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
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
