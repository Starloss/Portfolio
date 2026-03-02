import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
        cv_missing: 'Agrega public/cv.pdf para habilitar la descarga',
        lang_toggle: 'EN',
        // Projects
        project_healthcare_desc:
            'Plataforma que optimiza calidad y tiempos de respuesta en servicios de salud.',
        project_hybrid_desc: 'App móvil híbrida con soporte offline y CI/CD optimizado.',
        project_fullstack_desc: 'Conjunto de aplicaciones entregadas puntual y mantenibles.',
        project_be_desc:
            'Plataforma de reservas enfocada en estabilidad operativa, velocidad de respuesta y reducción de errores en flujos críticos de booking.',
        project_role_title: 'Rol',
        project_role_aria: 'rol desempeñado en el proyecto',
        project_be_role: 'Tech Lead / Full-Stack Lead Developer',
        project_contributions_title: 'Lo que hice en este proyecto',
        project_contributions_aria: 'lista de contribuciones del proyecto',
        project_be_contrib_1:
            'Lidero un equipo de más de 10 developers, organizando el trabajo técnico, priorizando iniciativas y acompañando la ejecución diaria.',
        project_be_contrib_2:
            'Diseño la arquitectura y desarrollo el código más sensible del producto, especialmente en flujos críticos de booking y negocio.',
        project_be_contrib_3:
            'Defino decisiones técnicas y de diseño, alineando mantenibilidad, rendimiento y calidad en todo el ciclo de desarrollo.',
        project_be_contrib_4:
            'Coordino con áreas de negocio para traducir necesidades operativas en soluciones técnicas concretas y escalables.',
        project_superwallet_desc:
            'Producto transaccional orientado a operaciones de booking y pagos, con foco en rendimiento, confiabilidad y experiencia fluida.',
        project_superwallet_role: 'Senior Developer',
        project_superwallet_contrib_1:
            'Desarrollé integraciones con APIs externas para el proceso de booking de hoteles, reduciendo tiempos de procesamiento en un 80%.',
        project_superwallet_contrib_2:
            'Implementé integraciones y mejoras para bookings de actividades, logrando una reducción de tiempo del 90%.',
        project_superwallet_contrib_3:
            'Construí funcionalidades clave de producto como sistemas de referidos y cupones, y optimicé la comunicación cliente-servidor en un 70%.',
        project_superwallet_contrib_4:
            'Participé en decisiones de flujo de la aplicación y mejoras de UI/UX para elevar claridad, conversión y experiencia general.',
        project_boda_desc:
            'Invitación interactiva de boda desarrollada como proyecto personal, diseñada, implementada y desplegada en 1 semana con arquitectura full-stack moderna.',
        project_boda_role: 'Full-Stack Developer (Proyecto Personal)',
        project_boda_contrib_1:
            'Diseñé y construí una experiencia mobile-first en Astro + TypeScript con secciones dinámicas, countdown en tiempo real y navegación fluida.',
        project_boda_contrib_2:
            'Implementé RSVP por token con Firestore para validación de invitados, confirmación de asistencia y control de cupos por invitación.',
        project_boda_contrib_3:
            'Integré carga de fotos en Firebase Storage y automatizaciones con Cloud Functions para envío de invitaciones y recordatorios programados.',
        project_boda_contrib_4:
            'Definí reglas de seguridad (Firestore/Storage), configuración de despliegue en Vercel y documentación operativa para puesta en producción rápida.',
        project_stack: 'Stack usado',
        project_repository_title: 'Repositorio',
        project_repository_aria: 'estado de repositorio del proyecto',
        project_repository_private: 'Privado',
        project_years: 'Años de desarrollo',
        project_go_back: 'Volver',
        project_back: 'Volver a proyectos',
        project_not_found: 'Proyecto no encontrado',
        project_prev_project: 'Proyecto anterior',
        project_next_project: 'Siguiente proyecto',
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
        cv_missing: 'Add public/cv.pdf to enable download',
        lang_toggle: 'ES',
        // Projects
        project_healthcare_desc:
            'Platform that improves quality and response times in healthcare services.',
        project_hybrid_desc: 'Hybrid mobile app with offline support and optimized CI/CD.',
        project_fullstack_desc: 'Set of punctual, maintainable full-stack applications delivered.',
        project_be_desc:
            'Booking platform focused on operational stability, fast response times, and error reduction across critical reservation flows.',
        project_role_title: 'Role',
        project_role_aria: 'role held in the project',
        project_be_role: 'Tech Lead / Full-Stack Lead Developer',
        project_contributions_title: 'What I built in this project',
        project_contributions_aria: 'project contributions list',
        project_be_contrib_1:
            'Lead a team of 10+ developers, organizing technical work, prioritizing initiatives, and guiding day-to-day execution.',
        project_be_contrib_2:
            'Own architecture decisions and develop the most sensitive code paths, especially across critical booking and business flows.',
        project_be_contrib_3:
            'Drive technical and product design decisions, balancing maintainability, performance, and delivery quality.',
        project_be_contrib_4:
            'Coordinate with business teams to translate operational needs into scalable technical solutions.',
        project_superwallet_desc:
            'Transactional product for booking and payment operations, focused on performance, reliability, and a smooth user experience.',
        project_superwallet_role: 'Senior Developer',
        project_superwallet_contrib_1:
            'Built external API integrations for hotel booking flows, reducing processing time by 80%.',
        project_superwallet_contrib_2:
            'Implemented integrations and flow improvements for activity bookings, achieving a 90% time reduction.',
        project_superwallet_contrib_3:
            'Developed key product features such as referral and coupon systems, while improving client-server response times by 70%.',
        project_superwallet_contrib_4:
            'Contributed to app flow decisions and UI/UX improvements to increase clarity, conversion, and overall user experience.',
        project_boda_desc:
            'Interactive wedding invitation built as a personal project, designed, implemented, and deployed in 1 week using a modern full-stack architecture.',
        project_boda_role: 'Full-Stack Developer (Personal Project)',
        project_boda_contrib_1:
            'Designed and built a mobile-first Astro + TypeScript experience with dynamic sections, real-time countdown, and smooth navigation.',
        project_boda_contrib_2:
            'Implemented token-based RSVP with Firestore for guest validation, attendance confirmation, and per-invitation guest limits.',
        project_boda_contrib_3:
            'Integrated photo uploads with Firebase Storage and automated Cloud Functions for invitation sending and scheduled reminders.',
        project_boda_contrib_4:
            'Defined security rules (Firestore/Storage), Vercel deployment configuration, and operational docs for fast production rollout.',
        project_stack: 'Used stack',
        project_repository_title: 'Repository',
        project_repository_aria: 'project repository status',
        project_repository_private: 'Private',
        project_years: 'Development years',
        project_go_back: 'Go back',
        project_back: 'Back to projects',
        project_not_found: 'Project not found',
        project_prev_project: 'Previous project',
        project_next_project: 'Next project',
        project_prev_image: 'Previous image',
        project_next_image: 'Next image',
    },
};

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_STORAGE_KEY = 'portfolio_locale';

function getInitialLocale(): Locale {
    if (typeof window === 'undefined') return 'es';
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return savedLocale === 'en' || savedLocale === 'es' ? savedLocale : 'es';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<Locale>(getInitialLocale);
    const switchLocale = useCallback(() => setLocale((l) => (l === 'es' ? 'en' : 'es')), []);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        document.documentElement.lang = locale;
    }, [locale]);
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
