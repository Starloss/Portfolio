import React, { createContext, useContext, useMemo } from 'react';

import { resolveContent, type Locale, type ResolvedContent } from '@/content';

interface I18nContextValue {
    locale: Locale;
    t: (key: string) => string;
    /** El contenido del sitio resuelto en el idioma actual. */
    content: ResolvedContent;
}

// Solo textos de la UI: el contenido bilingüe vive en src/content.
const translations: Record<Locale, Record<string, string>> = {
    es: {
        hero_cta_cv: 'Descargar CV',
        hero_cta_contact: 'Contactar',
        impact_title: 'Impacto',
        impact_see: 'Ver en {backing} →',
        featured_title: 'Proyectos destacados',
        project_work: 'Proyecto de trabajo',
        experience_list_aria: 'Experiencias',
        experience_achievements_aria: 'Logros',
        experience_project: 'Proyecto: {title} →',
        contact_phrase: '¿Buscas a alguien que lidere tu próximo producto? Escríbeme.',
        skills_title: 'Habilidades',
        skills_list_prefix: 'skills de',
        projects_title: 'Proyectos',
        experience_title: 'Experiencia',
        contact_title: 'Contacto',
        tech_aria: 'tecnologias',
        theme_toggle_dark: 'Oscuro',
        theme_toggle_light: 'Claro',
        nav_menu_open: 'Abrir menú',
        nav_menu_close: 'Cerrar menú',
        language: 'Idioma',
        cv_button: 'Descargar CV',
        project_context_title: 'Contexto',
        project_problem_title: 'Problema',
        project_role_title: 'Rol',
        project_role_aria: 'rol desempeñado en el proyecto',
        project_decisions_title: 'Decisiones clave',
        project_impact_title: 'Impacto',
        project_gallery_title: 'Galería',
        project_stack: 'Stack usado',
        project_repository_title: 'Repositorio',
        project_repository_aria: 'estado de repositorio del proyecto',
        project_repository_private: 'Privado',
        project_repository_view: 'Ver repositorio',
        project_live_url_view: 'Ver demo en vivo',
        project_period: 'Período',
        project_personal: 'Proyecto personal',
        project_go_back: 'Volver',
        project_not_found: 'Proyecto no encontrado',
        project_prev_project: 'Proyecto anterior',
        project_next_project: 'Siguiente proyecto',
        project_prev_image: 'Imagen anterior',
        project_next_image: 'Siguiente imagen',
        project_close_gallery: 'Cerrar galería',
        project_gallery_aria: 'galería',
    },
    en: {
        hero_cta_cv: 'Download CV',
        hero_cta_contact: 'Contact',
        impact_title: 'Impact',
        impact_see: 'See {backing} →',
        featured_title: 'Featured projects',
        project_work: 'Work project',
        experience_list_aria: 'Experiences',
        experience_achievements_aria: 'Achievements',
        experience_project: 'Project: {title} →',
        contact_phrase: 'Looking for someone to lead your next product? Get in touch.',
        skills_title: 'Skills',
        skills_list_prefix: 'skills of',
        projects_title: 'Projects',
        experience_title: 'Experience',
        contact_title: 'Contact',
        tech_aria: 'technologies',
        theme_toggle_dark: 'Dark',
        theme_toggle_light: 'Light',
        nav_menu_open: 'Open menu',
        nav_menu_close: 'Close menu',
        language: 'Language',
        cv_button: 'Download CV',
        project_context_title: 'Context',
        project_problem_title: 'Problem',
        project_role_title: 'Role',
        project_role_aria: 'role held in the project',
        project_decisions_title: 'Key decisions',
        project_impact_title: 'Impact',
        project_gallery_title: 'Gallery',
        project_stack: 'Used stack',
        project_repository_title: 'Repository',
        project_repository_aria: 'project repository status',
        project_repository_private: 'Private',
        project_repository_view: 'View repository',
        project_live_url_view: 'View live demo',
        project_period: 'Period',
        project_personal: 'Personal project',
        project_go_back: 'Go back',
        project_not_found: 'Project not found',
        project_prev_project: 'Previous project',
        project_next_project: 'Next project',
        project_prev_image: 'Previous image',
        project_next_image: 'Next image',
        project_close_gallery: 'Close gallery',
        project_gallery_aria: 'gallery',
    },
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** El idioma lo decide la URL: este provider lo recibe del layout de cada idioma. */
export const I18nProvider: React.FC<{ locale: Locale; children: React.ReactNode }> = ({
    locale,
    children,
}) => {
    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            t: (key: string) => translations[locale][key] ?? key,
            content: resolveContent(locale, new Date()),
        }),
        [locale],
    );
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
    return ctx;
}
