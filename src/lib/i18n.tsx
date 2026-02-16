import React, { createContext, useContext, useState, useCallback } from 'react';

type Locale = 'es' | 'en';

interface I18nContextValue {
    locale: Locale;
    t: (key: string) => string;
    switchLocale: () => void;
}

const translations: Record<Locale, Record<string, string>> = {
    es: {
        hero_greeting: 'Hola, soy',
        about_title: 'Sobre mí',
        about_aria: 'resumen profesional',
        skills_title: 'Habilidades',
        skills_aria: 'habilidades',
        skills_list_prefix: 'skills de',
        projects_title: 'Proyectos',
        projects_list_aria: 'lista de proyectos',
        experience_title: 'Experiencia',
        experience_aria: 'experiencia profesional',
        experience_tech_aria: 'tecnologías clave',
        contact_title: 'Contacto',
        tech_aria: 'tecnologias',
        contact_name: 'Nombre',
        contact_email: 'Correo',
        contact_message: 'Mensaje',
        contact_send: 'Enviar',
        contact_linkedin_label: 'LinkedIn',
        contact_email_label: 'Email',
        contact_github_label: 'GitHub',
        theme_toggle_dark: 'Oscuro',
        theme_toggle_light: 'Claro',
        nav_menu_open: 'Abrir menú',
        nav_menu_close: 'Cerrar menú',
        professional_summary:
            'Full-Stack Developer con más de 7 años construyendo soluciones web y móviles, liderando equipos y optimizando productividad.',
        cv_button: 'Descargar CV',
        lang_toggle: 'EN',
        // Projects
        project_healthcare_desc:
            'Plataforma que optimiza calidad y tiempos de respuesta en servicios de salud.',
        project_hybrid_desc: 'App móvil híbrida con soporte offline y CI/CD optimizado.',
        project_fullstack_desc: 'Conjunto de aplicaciones entregadas puntual y mantenibles.',
        project_be_desc:
            'Motor de reservas robusto con flujos de disponibilidad, tarifas dinámicas y checkout optimizado.',
        project_superwallet_desc:
            'Billetera digital con foco en transacciones seguras, trazabilidad y experiencia móvil fluida.',
        project_stack: 'Stack usado',
        project_years: 'Años de desarrollo',
        project_back: 'Volver a proyectos',
        project_not_found: 'Proyecto no encontrado',
        project_prev_image: 'Imagen anterior',
        project_next_image: 'Siguiente imagen',
    },
    en: {
        hero_greeting: "Hi, I'm",
        about_title: 'About me',
        about_aria: 'professional summary',
        skills_title: 'Skills',
        skills_aria: 'skills',
        skills_list_prefix: 'skills of',
        projects_title: 'Projects',
        projects_list_aria: 'projects list',
        experience_title: 'Experience',
        experience_aria: 'professional experience',
        experience_tech_aria: 'key technologies',
        contact_title: 'Contact',
        tech_aria: 'technologies',
        contact_name: 'Name',
        contact_email: 'Email',
        contact_message: 'Message',
        contact_send: 'Send',
        contact_linkedin_label: 'LinkedIn',
        contact_email_label: 'Email',
        contact_github_label: 'GitHub',
        theme_toggle_dark: 'Dark',
        theme_toggle_light: 'Light',
        nav_menu_open: 'Open menu',
        nav_menu_close: 'Close menu',
        professional_summary:
            'Full-Stack Developer with 7+ years building web & mobile solutions, leading teams and boosting productivity.',
        cv_button: 'Download CV',
        lang_toggle: 'ES',
        // Projects
        project_healthcare_desc:
            'Platform that improves quality and response times in healthcare services.',
        project_hybrid_desc: 'Hybrid mobile app with offline support and optimized CI/CD.',
        project_fullstack_desc: 'Set of punctual, maintainable full-stack applications delivered.',
        project_be_desc:
            'Robust booking engine with availability flows, dynamic pricing and optimized checkout.',
        project_superwallet_desc:
            'Digital wallet focused on secure transactions, traceability and smooth mobile UX.',
        project_stack: 'Used stack',
        project_years: 'Development years',
        project_back: 'Back to projects',
        project_not_found: 'Project not found',
        project_prev_image: 'Previous image',
        project_next_image: 'Next image',
    },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<Locale>('es');
    const switchLocale = useCallback(() => setLocale((l) => (l === 'es' ? 'en' : 'es')), []);
    const t = useCallback((key: string) => translations[locale][key] ?? key, [locale]);
    return (
        <I18nContext.Provider value={{ locale, t, switchLocale }}>{children}</I18nContext.Provider>
    );
};

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
    return ctx;
}
