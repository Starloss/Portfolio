import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@lib/i18n';
import { ThemeProvider } from '@lib/theme';

import type { Locale } from '@/content';

/** Renderiza un componente suelto con los providers de la app, en el idioma pedido. */
export function renderWithProviders(ui: React.ReactElement, locale: Locale = 'es', url = '/') {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <ThemeProvider>
                <I18nProvider locale={locale}>{ui}</I18nProvider>
            </ThemeProvider>
        </MemoryRouter>,
    );
}
