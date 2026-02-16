export interface SkillCategory {
    name: string;
    items: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        name: 'Front',
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
        name: 'Back',
        items: [
            'Node.js',
            'Python',
            'Django',
            'Next.js',
            'PostgreSQL',
            'MongoDB',
            'Prisma',
            'Firebase',
        ],
    },
    { name: 'DevOps', items: ['AWS', 'GCP', 'CI/CD Pipelines'] },
    {
        name: 'Soft Skills',
        items: ['Leadership', 'Mentoring', 'Problem-solving', 'Communication', 'Planning'],
    },
];
