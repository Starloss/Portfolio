import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import React from 'react';
import { App } from '@app/App';
import { ThemeProvider } from '@lib/theme';

describe('App', () => {
    it('renderiza el heading principal', () => {
        render(
            <ThemeProvider>
                <App />
            </ThemeProvider>,
        );
        expect(screen.getByRole('heading', { name: /hola, soy/i })).toBeInTheDocument();
    });

    it('muestra los proyectos con sus tecnologías', () => {
        render(
            <ThemeProvider>
                <App />
            </ThemeProvider>,
        );
        const projects = screen.getByRole('region', { name: 'Proyectos destacados' });
        expect(within(projects).getAllByRole('link').length).toBeGreaterThanOrEqual(2);
        // Limitar la búsqueda a la sección para evitar coincidencias en otras secciones
        expect(within(projects).getAllByText(/React/).length).toBeGreaterThan(0);
        expect(within(projects).getAllByText(/TypeScript|Angular|Ionic/).length).toBeGreaterThan(0);
    });

    it('muestra el footer con el año actual', () => {
        render(
            <ThemeProvider>
                <App />
            </ThemeProvider>,
        );
        const year = new Date().getFullYear();
        const footer = screen.getByRole('contentinfo');
        expect(footer.textContent).toMatch(String(year));
    });
});
