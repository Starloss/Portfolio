import type { Project } from '@lib/types';

// Fuente de datos (mock). En un futuro puede migrarse a fetch hacia una API.
const PROJECTS: Project[] = [
  {
    title: 'Healthcare Platform',
    url: '#',
    description: 'project_healthcare_desc',
    tech: ['React', 'Node.js', 'TypeScript'],
  },
  {
    title: 'Hybrid Mobile App',
    url: '#',
    description: 'project_hybrid_desc',
    tech: ['Ionic', 'Angular', 'Firebase'],
  },
  {
    title: 'Full-Stack Solutions',
    url: '#',
    description: 'project_fullstack_desc',
    tech: ['Node.js', 'React', 'Angular'],
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
