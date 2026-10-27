// Modelo del contenido del sitio. El vocabulario sigue GLOSSARY.md.

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];

export type Localized = { es: string; en: string };
/** 'YYYY-MM' */
export type YearMonth = string;
/** Dato pendiente: el build falla si queda alguno. */
export type Pending = { pending?: true };

export interface Experience {
    id: string;
    /** Empresa, con su nombre canónico. */
    company: string;
    role: Localized;
    location: Localized;
    start: YearMonth;
    /** Ausente = en curso. */
    end?: YearMonth;
    /** Logros, ordenados por importancia. */
    achievements: (Pending & { text: Localized })[];
    tech: string[];
}

export interface GalleryImage {
    src: string;
    alt: Localized;
    caption?: Localized;
}

export interface CaseStudy {
    /** Resumen de tarjeta. */
    summary: Localized;
    context: Localized[];
    problem: Localized;
    role: Localized;
    decisions: { title: Localized; explanation: Localized }[];
    impact: (Pending & { text: Localized; metric?: Localized })[];
    gallery: GalleryImage[];
}

export interface Project {
    id: string;
    title: Localized;
    /** Ausente = Proyecto personal. */
    experienceId?: string;
    /** Los destacados se muestran en el orden de la lista. */
    featured: boolean;
    start: YearMonth;
    end?: YearMonth;
    tech: string[];
    repositoryUrl?: string;
    liveUrl?: string;
    caseStudy: CaseStudy;
}

export type Backing =
    | { kind: 'experience'; id: string }
    | { kind: 'project'; id: string }
    | { kind: 'trajectory' };

export type KeyFigure = Pending & {
    value: Localized | { computed: 'trajectory-years' };
    label: Localized;
    backing: Backing;
};

/** Formación: no forma parte de la Trayectoria. */
export interface Education {
    institution: string;
    title: Localized;
    location: Localized;
    startYear: number;
    endYear?: number;
}

export interface SkillCategory {
    name: Localized;
    /** string = tecnología, con nombre fijo. */
    items: (string | Localized)[];
}

export interface HeroText {
    greeting: Localized;
    valueProposition: Pending & { text: Localized };
    location: Localized;
}

export interface Profile {
    name: string;
    fullName: string;
    role: string;
    email: string;
    linkedin: string;
    github: string;
    /** Resumen del CV; `{years}` se reemplaza por los años de Trayectoria. */
    cvSummary: Pending & { text: Localized };
}

export interface Content {
    profile: Profile;
    hero: HeroText;
    experiences: Experience[];
    projects: Project[];
    keyFigures: KeyFigure[];
    education: Education[];
    skills: SkillCategory[];
}
