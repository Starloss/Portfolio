import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import React from 'react';
import { App } from '@app/App';
import { I18nProvider } from '@lib/i18n';
import { ThemeProvider } from '@lib/theme';

describe('App', () => {
    it('renderiza el heading principal', () => {
        render(
            <ThemeProvider>
                <I18nProvider>
                    <App />
                </I18nProvider>
            </ThemeProvider>,
        );
        expect(screen.getByRole('heading', { name: /hola, soy/i })).toBeInTheDocument();
    });

    it('muestra los proyectos con sus tecnologías', () => {
        render(
            <ThemeProvider>
                <I18nProvider>
                    <App />
                </I18nProvider>
            </ThemeProvider>,
        );
        const projectList = screen.getByRole('list', { name: /lista de proyectos/i });
        const items = within(projectList).getAllByRole('listitem');
        expect(items.length).toBeGreaterThanOrEqual(2);
        // Limitar búsqueda dentro de la lista para evitar coincidencias duplicadas en otras secciones
        expect(within(projectList).getAllByText(/React/).length).toBeGreaterThan(0);
        expect(within(projectList).getAllByText(/TypeScript|Angular|Ionic/).length).toBeGreaterThan(
            0,
        );
    });

    it('muestra el footer con el año actual', () => {
        render(
            <ThemeProvider>
                <I18nProvider>
                    <App />
                </I18nProvider>
            </ThemeProvider>,
        );
        const year = new Date().getFullYear();
        const footer = screen.getByRole('contentinfo');
        expect(footer.textContent).toMatch(String(year));
    });
});
