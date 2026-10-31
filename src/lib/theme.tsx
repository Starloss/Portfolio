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
const TURN_MS = BOVEDA_SECONDS * 1000;

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

    // La Escena gira enseguida; la UI cambia cuando el giro cruza la mitad. Si se revierte, el giro
    // vuelve por el mismo camino, y la UI cambia al cruzarla de vuelta. Sin giro, enseguida.
    const appliedRef = useRef(theme);
    const turnRef = useRef<{ position: number; at: number; forward: boolean } | null>(null);
    useEffect(() => {
        if (appliedRef.current === theme) return;
        appliedRef.current = theme;
        const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            apply();
            return;
        }
        const now = performance.now();
        const previous = turnRef.current;
        const moved = previous ? now - previous.at : 0;
        const position = previous
            ? Math.max(
                  0,
                  Math.min(TURN_MS, previous.position + (previous.forward ? moved : -moved)),
              )
            : TURN_MS;
        const turn =
            previous && position > 0 && position < TURN_MS
                ? { position, at: now, forward: !previous.forward }
                : { position: 0, at: now, forward: true };
        turnRef.current = turn;
        const middle = TURN_MS / 2;
        const untilMiddle = turn.forward ? middle - turn.position : turn.position - middle;
        // Si la mitad ya quedó atrás en este sentido, la UI ya está en el tema que toca.
        if (untilMiddle <= 0) return;
        const timer = window.setTimeout(apply, untilMiddle);
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
