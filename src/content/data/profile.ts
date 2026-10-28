import type { Education, HeroText, KeyFigure, Profile, SkillCategory } from '../types';

export const PROFILE: Profile = {
    name: 'Diego Rangel',
    fullName: 'Diego Alfonso Rangel De Ornelas',
    role: 'Full-Stack Lead Developer',
    email: 'starloss09@gmail.com',
    linkedin: 'https://www.linkedin.com/in/diego-rangel-de-ornelas',
    github: 'https://github.com/Starloss',
    cvSummary: {
        text: {
            es: 'Full-Stack Lead Developer con {years} años de experiencia. Lidero equipos que construyen productos web y móviles rápidos, escalables y medibles. En CORE Care and Health Systems lidero a más de 10 devs con 100% de entregas a tiempo, y en XHype reduje 80% el tiempo de booking hotelero de SuperWallet.',
            en: "Full-Stack Lead Developer with {years} years of experience. I lead teams that build fast, scalable, measurable web and mobile products. At CORE Care and Health Systems I lead 10+ developers with 100% on-time delivery, and at XHype I cut SuperWallet's hotel booking processing time by 80%.",
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
        value: { es: '100%', en: '100%' },
        label: { es: 'entregas a tiempo', en: 'on-time delivery' },
        backing: { kind: 'experience', id: 'core' },
    },
];

export const EDUCATION: Education[] = [
    {
        institution: 'Universidad Central de Venezuela',
        title: { es: 'Computación', en: 'Computer Science' },
        location: { es: 'Caracas, Venezuela', en: 'Caracas, Venezuela' },
        startYear: 2016,
        endYear: 2021,
    },
];

export const SKILLS: SkillCategory[] = [
    {
        name: { es: 'Front', en: 'Front' },
        items: [
            'React',
            'React Native',
            'Astro',
            'Angular',
            'Ionic',
            'TypeScript',
            'Vue',
            'HTML5',
            'CSS3',
        ],
    },
    {
        name: { es: 'Back', en: 'Back' },
        items: [
            'Node.js',
            'Python',
            'Django',
            'Nest',
            'Next.js',
            'PostgreSQL',
            'MongoDB',
            'Prisma',
            'Firebase',
            'Firestore',
            'Cloud Functions',
        ],
    },
    { name: { es: 'DevOps', en: 'DevOps' }, items: ['AWS', 'GCP', 'Vercel', 'CI/CD Pipelines'] },
    {
        name: { es: 'Habilidades blandas', en: 'Soft Skills' },
        items: [
            { es: 'Liderazgo', en: 'Leadership' },
            { es: 'Mentoría', en: 'Mentoring' },
            { es: 'Resolución de problemas', en: 'Problem-solving' },
            { es: 'Comunicación', en: 'Communication' },
            { es: 'Planificación', en: 'Planning' },
        ],
    },
];
