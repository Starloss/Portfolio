import type { Education, HeroText, KeyFigure, Profile, SkillCategory } from '../types';

export const PROFILE: Profile = {
    name: 'Diego Rangel',
    fullName: 'Diego Alfonso Rangel De Ornelas',
    role: 'Full-Stack Lead Developer',
    email: 'contact@diegorangel.dev',
    linkedin: 'https://www.linkedin.com/in/diego-rangel-de-ornelas',
    github: 'https://github.com/Starloss',
    cvSummary: {
        text: {
            es: 'Full-Stack Lead Developer con {years} años construyendo productos web y móviles con React, Angular, Ionic, TypeScript y Node.js, liderando equipos desde 2021. Desde octubre de 2023 lidero a más de 10 devs que me reportan en CORE Care and Health Systems, con la productividad del equipo un 60% más alta y 100% de entregas a tiempo. Sostengo una vara de calidad alta (los errores críticos del día 1 por release bajaron de unos 5 a 0), lidero la forma de trabajar de mi equipo asistida por IA con Claude Code y me enfoco en resultados medibles: el tiempo de booking hotelero bajó 80% en XHype y los tiempos de despliegue, 70% con CI/CD en Wocoon.',
            en: 'Full-Stack Lead Developer with {years} years building web and mobile products with React, Angular, Ionic, TypeScript and Node.js, leading teams since 2021. Since October 2023 I have led 10+ developers who report to me at CORE Care and Health Systems, with team productivity up 60% and 100% on-time delivery. I hold a high quality bar (critical day-1 production errors per release cut from about 5 to 0), lead my team’s AI-assisted way of working with Claude Code, and focus on measurable results: hotel booking processing time cut by 80% at XHype and deployment times cut by 70% with CI/CD at Wocoon.',
        },
    },
};

export const HERO: HeroText = {
    greeting: { es: 'Hola, soy', en: "Hi, I'm" },
    valueProposition: {
        text: {
            es: 'Lidero equipos que construyen productos web y móviles rápidos, escalables y medibles.',
            en: 'I lead teams that build fast, scalable, measurable web and mobile products.',
        },
    },
    location: { es: 'Caracas, Venezuela · Remoto', en: 'Caracas, Venezuela · Remote' },
};

// Cifras clave de la franja de Impacto, en orden.
export const KEY_FIGURES: KeyFigure[] = [
    {
        value: { computed: 'trajectory-years' },
        label: { es: 'años de experiencia', en: 'years of experience' },
        backing: { kind: 'trajectory' },
    },
    {
        value: { es: '10+', en: '10+' },
        label: { es: 'devs liderados', en: 'developers led' },
        backing: { kind: 'experience', id: 'core' },
    },
    {
        value: { es: '−80%', en: '−80%' },
        label: { es: 'tiempo de booking hotelero', en: 'hotel booking processing time' },
        backing: { kind: 'project', id: 'superwallet' },
    },
    {
        value: { es: '5 → 0', en: '5 → 0' },
        label: {
            es: 'errores críticos del día 1 por release',
            en: 'critical day-1 production errors per release',
        },
        backing: { kind: 'experience', id: 'core' },
    },
];

export const EDUCATION: Education[] = [
    {
        institution: 'Universidad Central de Venezuela',
        title: { es: 'Licenciatura en Computación', en: 'Bachelor’s degree in Computer Science' },
        location: { es: 'Caracas, Venezuela', en: 'Caracas, Venezuela' },
        startYear: 2016,
        endYear: 2021,
    },
];

// Agrupadas como las Core Competencies del CV.
export const SKILLS: SkillCategory[] = [
    {
        name: {
            es: 'Liderazgo técnico y personas',
            en: 'Technical Leadership & People Management',
        },
        items: [
            { es: 'Más de 10 reportes directos', en: '10+ direct reports' },
            { es: 'Contratación y entrevistas técnicas', en: 'Hiring and technical interviews' },
            { es: 'One-on-ones y planes de crecimiento', en: 'One-on-ones and growth plans' },
            { es: 'Evaluaciones de desempeño', en: 'Performance reviews' },
            { es: 'Manejo de bajo rendimiento', en: 'Managing underperformance' },
            { es: 'Planificación del frontend a DevOps', en: 'Planning from frontend to DevOps' },
        ],
    },
    {
        name: { es: 'Delivery y Agile', en: 'Delivery & Agile' },
        items: [
            'Scrum Master',
            {
                es: 'Prioridades y trade-offs con producto',
                en: 'Priorities and trade-offs with product',
            },
            { es: '100% de entregas a tiempo', en: '100% on-time delivery' },
        ],
    },
    {
        name: { es: 'Calidad y testing', en: 'Quality & Testing' },
        items: [
            { es: '80%+ de cobertura', en: '80%+ code coverage' },
            { es: 'Pruebas unitarias', en: 'Unit testing' },
            { es: 'Integración', en: 'Integration' },
            'E2E',
            { es: 'Contrato', en: 'Contract' },
            { es: 'Mutación', en: 'Mutation' },
        ],
    },
    {
        name: { es: 'Desarrollo asistido por IA', en: 'AI-Assisted Development' },
        items: [
            'Claude Code',
            { es: 'Orquestación de agentes', en: 'Agent orchestration' },
            { es: 'Skills propias', en: 'Custom skills' },
            { es: 'Servidores MCP', en: 'MCP servers' },
        ],
    },
    {
        name: { es: 'Frontend', en: 'Frontend' },
        items: [
            'React',
            'React Native',
            'Angular',
            'Vue',
            'Astro',
            'Ionic',
            'TypeScript',
            'Redux',
            'Zustand',
            'styled-components',
            'Tailwind',
            'HTML5',
            'CSS3',
        ],
    },
    {
        name: { es: 'Backend y datos', en: 'Backend & Data' },
        items: [
            'Node.js',
            'Nest',
            'Next.js',
            'Python',
            'Django',
            'PostgreSQL',
            'MongoDB',
            'Prisma',
            'Firebase',
            'Firestore',
            'Cloud Functions',
        ],
    },
    {
        name: { es: 'DevOps y cloud', en: 'DevOps & Cloud' },
        items: ['AWS', 'GCP', 'Vercel', 'Docker', 'CI/CD Pipelines'],
    },
    {
        name: { es: 'Certificaciones', en: 'Certifications' },
        items: ['Scrum', 'Angular', { es: 'Inglés', en: 'English' }],
    },
    {
        name: { es: 'Idiomas', en: 'Languages' },
        items: [
            { es: 'Español (nativo)', en: 'Spanish (native)' },
            { es: 'Inglés (fluido, C1/C2)', en: 'English (fluent, C1/C2)' },
        ],
    },
];
