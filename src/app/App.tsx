import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '@lib/i18n';
import { localizedPath } from '@lib/locale-path';

import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail';

import type { Locale } from '@/content';

const LocaleLayout: React.FC<{ locale: Locale }> = ({ locale }) => {
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);
    return (
        <I18nProvider locale={locale}>
            <Outlet />
        </I18nProvider>
    );
};

const localeRoutes = (locale: Locale) => (
    <>
        <Route index element={<Home />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="*" element={<Navigate to={localizedPath(locale, '/')} replace />} />
    </>
);

export const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/en" element={<LocaleLayout locale="en" />}>
            {localeRoutes('en')}
        </Route>
        <Route path="/" element={<LocaleLayout locale="es" />}>
            {localeRoutes('es')}
        </Route>
    </Routes>
);

export const App: React.FC = () => (
    <BrowserRouter>
        <AppRoutes />
    </BrowserRouter>
);
