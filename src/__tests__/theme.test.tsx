import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@lib/theme';

const Consumer: React.FC = () => {
    const { theme } = useTheme();
    return <span data-testid="theme">{theme}</span>;
};

describe('ThemeProvider branches', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('usa valor almacenado en localStorage', () => {
        window.localStorage.setItem('theme', 'light');
        render(
            <ThemeProvider>
                <Consumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme').textContent).toBe('light');
    });

    it('usa media query cuando no hay valor almacenado', () => {
        // @ts-expect-error mock
        window.matchMedia = () => ({ matches: false });
        render(
            <ThemeProvider>
                <Consumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme').textContent).toBe('light');
    });
});
