import { EXPERIENCES } from './data/experiences';
import { EDUCATION, HERO, KEY_FIGURES, PROFILE, SKILLS } from './data/profile';
import { PROJECTS } from './data/projects';
import type { Backing, Content, Locale, YearMonth } from './types';

export * from './types';

export const CONTENT: Content = {
    profile: PROFILE,
    hero: HERO,
    experiences: EXPERIENCES,
    projects: PROJECTS,
    keyFigures: KEY_FIGURES,
    education: EDUCATION,
    skills: SKILLS,
};

const parseYearMonth = (ym: YearMonth) => {
    const [year, month] = ym.split('-').map(Number);
    return { year, month };
};

/** Años completos desde el inicio de la primera Experiencia, con sufijo "+". */
function trajectoryYears(content: Content, today: Date): string {
    const first = content.experiences
        .map((e) => e.start)
        .sort()
        .at(0);
    if (!first) return '0+';
    const { year, month } = parseYearMonth(first);
    const months = (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);
    return `${Math.floor(months / 12)}+`;
}

const MONTHS: Record<Locale, string[]> = {
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const ONGOING: Record<Locale, string> = { es: 'Presente', en: 'Present' };

function formatYearMonth(ym: YearMonth, locale: Locale) {
    const { year, month } = parseYearMonth(ym);
    return `${MONTHS[locale][month - 1]} ${year}`;
}

/** "Sep 2018 – Ago 2020", "Oct 2022 – Presente" o, si empieza y termina el mismo mes, "Mar 2026". */
export function formatPeriod(start: YearMonth, end: YearMonth | undefined, locale: Locale) {
    if (end === start) return formatYearMonth(start, locale);
    return `${formatYearMonth(start, locale)} – ${end ? formatYearMonth(end, locale) : ONGOING[locale]}`;
}

const byStartDesc = <T extends { start: YearMonth }>(a: T, b: T) => b.start.localeCompare(a.start);

export function resolveContent(locale: Locale, today: Date, content: Content = CONTENT) {
    const experiences = [...content.experiences].sort(byStartDesc).map((e) => ({
        id: e.id,
        company: e.company,
        role: e.role[locale],
        location: e.location[locale],
        period: formatPeriod(e.start, e.end, locale),
        achievements: e.achievements.map((a) => a.text[locale]),
        tech: e.tech,
    }));
    const years = trajectoryYears(content, today);
    const companyOf = (experienceId?: string) =>
        content.experiences.find((e) => e.id === experienceId)?.company;

    const projects = content.projects.map((p) => {
        const cs = p.caseStudy;
        return {
            id: p.id,
            title: p.title[locale],
            company: companyOf(p.experienceId),
            featured: p.featured,
            period: formatPeriod(p.start, p.end, locale),
            tech: p.tech,
            repositoryUrl: p.repositoryUrl,
            liveUrl: p.liveUrl,
            caseStudy: {
                summary: cs.summary[locale],
                context: cs.context.map((c) => c[locale]),
                problem: cs.problem[locale],
                role: cs.role[locale],
                decisions: cs.decisions.map((d) => ({
                    title: d.title[locale],
                    explanation: d.explanation[locale],
                })),
                impact: cs.impact.map((i) => ({
                    metric: i.metric?.[locale],
                    text: i.text[locale],
                })),
                gallery: cs.gallery.map((g) => ({
                    src: g.src,
                    alt: g.alt[locale],
                    ...(g.caption ? { caption: g.caption[locale] } : {}),
                })),
            },
        };
    });

    const backingOf = (backing: Backing) => {
        if (backing.kind === 'trajectory') return { kind: backing.kind, label: TRAJECTORY[locale] };
        const label =
            backing.kind === 'experience'
                ? companyOf(backing.id)
                : projects.find((p) => p.id === backing.id)?.title;
        return { kind: backing.kind, id: backing.id, label: label ?? backing.id };
    };

    return {
        locale,
        profile: {
            name: content.profile.name,
            fullName: content.profile.fullName,
            role: content.profile.role,
            email: content.profile.email,
            linkedin: content.profile.linkedin,
            github: content.profile.github,
            cvSummary: content.profile.cvSummary.text[locale].replace('{years}', years),
        },
        hero: {
            greeting: content.hero.greeting[locale],
            valueProposition: content.hero.valueProposition.text[locale],
            location: content.hero.location[locale],
        },
        trajectoryYears: years,
        experiences,
        projects,
        featuredProjects: projects.filter((p) => p.featured),
        keyFigures: content.keyFigures.map((f) => ({
            value: 'computed' in f.value ? years : f.value[locale],
            label: f.label[locale],
            backing: backingOf(f.backing),
        })),
        education: content.education.map((e) => ({
            institution: e.institution,
            title: e.title[locale],
            location: e.location[locale],
            period: e.endYear ? `${e.startYear} – ${e.endYear}` : `${e.startYear}`,
        })),
        skills: content.skills.map((s) => ({
            name: s.name[locale],
            items: s.items.map((i) => (typeof i === 'string' ? i : i[locale])),
        })),
    };
}

const TRAJECTORY: Record<Locale, string> = { es: 'Trayectoria', en: 'Career' };

export type ResolvedContent = ReturnType<typeof resolveContent>;
export type ResolvedProject = ResolvedContent['projects'][number];
