import type { Project } from '@lib/types';

// Fuente de datos (mock). En un futuro puede migrarse a fetch hacia una API.
const PROJECTS: Project[] = [
    {
        id: 'be-booking-engine',
        title: 'BE - Booking Engine',
        description: 'project_be_desc',
        tech: ['React', 'TypeScript', 'Python', 'Django', 'AWS'],
        years: '2022 - 2025',
        images: [
            '/projects/be-1.svg',
            '/projects/be-2.svg',
            '/projects/be-3.svg',
            '/projects/be-4.svg',
            '/projects/be-5.svg',
        ],
    },
    {
        id: 'superwallet',
        title: 'SuperWallet',
        description: 'project_superwallet_desc',
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
        years: '2021 - 2026',
        images: [
            '/projects/superwallet-1.svg',
            '/projects/superwallet-2.svg',
            '/projects/superwallet-3.svg',
            '/projects/superwallet-4.svg',
            '/projects/superwallet-5.svg',
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
