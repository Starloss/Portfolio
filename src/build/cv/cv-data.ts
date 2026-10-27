import { localizedPath, projectPath } from '@lib/locale-path';

import { resolveContent, type Locale } from '@/content';

const HEADINGS: Record<
    Locale,
    Record<'summary' | 'experience' | 'projects' | 'education' | 'skills', string>
> = {
    es: {
        summary: 'Resumen',
        experience: 'Experiencia',
        projects: 'Proyectos destacados',
        education: 'Formación',
        skills: 'Skills',
    },
    en: {
        summary: 'Summary',
        experience: 'Experience',
        projects: 'Featured projects',
        education: 'Education',
        skills: 'Skills',
    },
};

/** Lo que muestra el CV de un idioma, sacado del mismo contenido que el sitio. */
export function cvData(locale: Locale, today: Date, siteUrl: string) {
    const content = resolveContent(locale, today);
    const { profile } = content;
    return {
        locale,
        headings: HEADINGS[locale],
        header: {
            fullName: profile.fullName,
            role: profile.role,
            // Sin teléfono: el CV es público.
            contacts: [
                { label: profile.email, url: `mailto:${profile.email}` },
                { label: 'LinkedIn', url: profile.linkedin },
                { label: 'GitHub', url: profile.github },
                { label: siteUrl.replace(/^https?:\/\//, ''), url: siteUrl },
            ],
        },
        summary: profile.cvSummary,
        experiences: content.experiences.map((e) => ({
            role: e.role,
            company: e.company,
            location: e.location,
            period: e.period,
            achievements: e.achievements,
            projects: content.projects.filter((p) => p.company === e.company).map((p) => p.title),
        })),
        featuredProjects: content.featuredProjects.map((p) => ({
            title: p.title,
            summary: p.caseStudy.summary,
            url: `${siteUrl}${localizedPath(locale, projectPath(p.id))}`,
        })),
        education: content.education,
        skills: content.skills,
    };
}

export type CvData = ReturnType<typeof cvData>;
