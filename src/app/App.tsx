import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { MotionProvider } from '@lib/motion';
import { I18nProvider } from '@lib/i18n';
import { localizedPath } from '@lib/locale-path';

import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail';
import { CASE_STUDY_HEIGHT } from './scene/camera';
import { EscenaUpgrade } from './scene/EscenaUpgrade';

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

// Una sola Escena WebGL para todo el sitio, fuera de las rutas: al navegar conserva el Clima y no se
// ve la SVG mientras otra se prepara. Va después de las rutas, para pintarse encima de la Escena SVG.
const SiteEscena: React.FC = () => {
    const { pathname } = useLocation();
    return (
        <EscenaUpgrade height={pathname.includes('/projects/') ? CASE_STUDY_HEIGHT : undefined} />
    );
};

export const AppRoutes: React.FC = () => (
    <>
        <Routes>
            <Route path="/en" element={<LocaleLayout locale="en" />}>
                {localeRoutes('en')}
            </Route>
            <Route path="/" element={<LocaleLayout locale="es" />}>
                {localeRoutes('es')}
            </Route>
        </Routes>
        <SiteEscena />
    </>
);

export const App: React.FC = () => (
    <BrowserRouter>
        <MotionProvider>
            <AppRoutes />
        </MotionProvider>
    </BrowserRouter>
);
