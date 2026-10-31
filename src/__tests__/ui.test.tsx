import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from '@app/components/ui/Heading';
import { Section } from '@app/components/ui/Section';
import { I18nProvider, useI18n } from '@lib/i18n';

describe('UI primitives', () => {
    it('Heading levels y visuallyHidden', () => {
        const { rerender } = render(<Heading level={1}>H1</Heading>);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
        rerender(<Heading level={3}>H3</Heading>);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3');
        rerender(
            <Heading level={4} visuallyHidden>
                Hidden
            </Heading>,
        );
        const hidden = screen.getByText('Hidden');
        expect(hidden.className).toMatch(/sr-only/);
    });

    it('Section con y sin título y adorno', () => {
        const { rerender } = render(
            <Section title="Titulo" titleRightAdornment={<span data-testid="adorno">*</span>}>
                <p>contenido</p>
            </Section>,
        );
        expect(screen.getByRole('heading', { name: 'Titulo' })).toBeInTheDocument();
        expect(screen.getByTestId('adorno')).toBeInTheDocument();
        rerender(
            <Section>
                <p>solo contenido</p>
            </Section>,
        );
        expect(screen.queryByRole('heading', { name: 'Titulo' })).not.toBeInTheDocument();
    });
});

describe('i18n fallback', () => {
    it('devuelve la key si no existe traducción', () => {
        const MissingKey: React.FC = () => {
            const { t } = useI18n();
            return <span data-testid="txt">{t('clave_inexistente_xyz')}</span>;
        };
        render(
            <I18nProvider locale="es">
                <MissingKey />
            </I18nProvider>,
        );
        expect(screen.getByTestId('txt').textContent).toBe('clave_inexistente_xyz');
    });
    it('lanza error al usar hook fuera del provider', () => {
        const Err: React.FC = () => {
            useI18n();
            return null;
        };
        // React reporta el error por consola antes de relanzarlo.
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            expect(() => render(<Err />)).toThrow();
        } finally {
            consoleError.mockRestore();
        }
    });
});
