import type { Project } from '@lib/types';

// Fuente de datos (mock). En un futuro puede migrarse a fetch hacia una API.
const PROJECTS: Project[] = [
    {
        id: 'healthcare-platform',
        title: 'Healthcare Platform',
        description: 'project_healthcare_desc',
        tech: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        years: '2021 - 2024',
        images: [
            '/projects/healthcare-1.svg',
            '/projects/healthcare-2.svg',
            '/projects/healthcare-3.svg',
        ],
    },
    {
        id: 'hybrid-mobile-app',
        title: 'Hybrid Mobile App',
        description: 'project_hybrid_desc',
        tech: ['Ionic', 'Angular', 'React Native', 'Firebase'],
        years: '2020 - 2023',
        images: ['/projects/hybrid-1.svg', '/projects/hybrid-2.svg', '/projects/hybrid-3.svg'],
    },
    {
        id: 'full-stack-solutions',
        title: 'Full-Stack Solutions',
        description: 'project_fullstack_desc',
        tech: ['Next.js', 'Django', 'MongoDB', 'AWS', 'GCP'],
        years: '2019 - 2025',
        images: [
            '/projects/fullstack-1.svg',
            '/projects/fullstack-2.svg',
            '/projects/fullstack-3.svg',
        ],
    },
];

export function getProjects(): Promise<Project[]> {
    // Patrón React 19: se puede usar `use(getProjects())` con una Promesa.
    // Mantenemos resolución inmediata para no complicar tests.
    return Promise.resolve(PROJECTS);
}

export function getProjectsSync(): Project[] {
    return PROJECTS;
}

export function getProjectById(id: string): Project | undefined {
    return PROJECTS.find((project) => project.id === id);
}
