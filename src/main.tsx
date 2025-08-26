import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { I18nProvider } from '@lib/i18n';
import { ThemeProvider } from '@lib/theme';

import './styles.css';
import './tailwind.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>,
);
