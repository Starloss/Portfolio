import { LOCALES, type Content } from './types';

interface Options {
    /** Comprueba si existe un archivo publicado, p. ej. "/projects/x.jpg". */
    fileExists: (src: string) => boolean;
}

/** Un texto traducible: sus claves son idiomas, aunque falte alguno. */
const isLocalized = (value: object) => {
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((k) => (LOCALES as string[]).includes(k));
};

/** Ruta legible de un campo: "projects[0].caseStudy.problem". */
const fieldPath = (base: string, key: string | number) =>
    typeof key === 'number' ? `${base}[${key}]` : base ? `${base}.${key}` : key;

/** Recorre todo el contenido buscando Datos pendientes y traducciones incompletas. */
function walk(value: unknown, at: string, problems: string[]) {
    if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, fieldPath(at, i), problems));
        return;
    }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (record.pending === true) problems.push(`Dato pendiente en ${at}`);
    if (isLocalized(record)) {
        for (const locale of LOCALES) {
            const text = record[locale];
            if (typeof text !== 'string' || !text.trim())
                problems.push(`Falta "${locale}" en ${at}`);
        }
        return;
    }
    for (const [key, child] of Object.entries(record)) walk(child, fieldPath(at, key), problems);
}

/** Devuelve la lista de problemas; vacía si el contenido se puede publicar. */
export function validateContent(content: Content, { fileExists }: Options): string[] {
    const problems: string[] = [];
    walk(content, '', problems);

    const experienceIds = new Set(content.experiences.map((e) => e.id));
    const projectIds = new Set(content.projects.map((p) => p.id));

    content.experiences.forEach((e, i) => {
        if (e.achievements.length < 2)
            problems.push(`experiences[${i}] ("${e.id}") tiene menos de 2 Logros`);
    });

    content.projects.forEach((p, i) => {
        if (p.experienceId && !experienceIds.has(p.experienceId))
            problems.push(`projects[${i}]: la Experiencia "${p.experienceId}" no existe`);
        p.caseStudy.gallery.forEach((g, j) => {
            if (!fileExists(g.src))
                problems.push(
                    `projects[${i}].caseStudy.gallery[${j}]: no existe el archivo ${g.src}`,
                );
        });
    });

    content.keyFigures.forEach((f, i) => {
        const { backing } = f;
        if (backing.kind === 'trajectory') return;
        const ids = backing.kind === 'experience' ? experienceIds : projectIds;
        if (!ids.has(backing.id))
            problems.push(
                `keyFigures[${i}]: el respaldo ${backing.kind} "${backing.id}" no existe`,
            );
    });

    return problems;
}
