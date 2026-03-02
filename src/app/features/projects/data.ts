import type { Project } from '@lib/types';

// Fuente de datos (mock). En un futuro puede migrarse a fetch hacia una API.
const PROJECTS: Project[] = [
    {
        id: 'be-booking-engine',
        title: 'BE - Booking Engine',
        company: 'CORE',
        description: 'project_be_desc',
        role: 'project_be_role',
        contributions: [
            'project_be_contrib_1',
            'project_be_contrib_2',
            'project_be_contrib_3',
            'project_be_contrib_4',
        ],
        tech: ['React', 'TypeScript', 'Python', 'Django', 'AWS'],
        years: '2022 - Present',
        images: [
            '/projects/be-1.jpg',
            '/projects/be-2.jpg',
            '/projects/be-3.jpg',
            '/projects/be-4.jpg',
            '/projects/be-5.jpg',
            '/projects/be-6.jpg',
            '/projects/be-7.jpg',
            '/projects/be-8.jpg',
            '/projects/be-9.jpg',
            '/projects/be-10.jpg',
        ],
    },
    {
        id: 'superwallet',
        title: 'SuperWallet',
        company: 'XHype',
        description: 'project_superwallet_desc',
        role: 'project_superwallet_role',
        contributions: [
            'project_superwallet_contrib_1',
            'project_superwallet_contrib_2',
            'project_superwallet_contrib_3',
            'project_superwallet_contrib_4',
        ],
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
        years: '2021 - 2026',
        images: [
            '/projects/superwallet-1.svg',
            '/projects/superwallet-2.svg',
            '/projects/superwallet-3.svg',
            '/projects/superwallet-4.svg',
            '/projects/superwallet-5.svg',
            '/projects/superwallet-6.svg',
            '/projects/superwallet-7.svg',
            '/projects/superwallet-8.svg',
            '/projects/superwallet-9.svg',
            '/projects/superwallet-10.svg',
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
