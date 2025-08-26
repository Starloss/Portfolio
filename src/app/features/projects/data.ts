import type { Project } from '@lib/types';

// Fuente de datos (mock). En un futuro puede migrarse a fetch hacia una API.
const PROJECTS: Project[] = [
  {
    title: 'Proyecto 1',
    url: '#',
    description: 'Descripción corta',
    tech: ['React', 'TypeScript'],
  },
  { title: 'Proyecto 2', url: '#', description: 'Descripción corta', tech: ['Node', 'Express'] },
];

export function getProjects(): Promise<Project[]> {
  // Patrón React 19: se puede usar `use(getProjects())` con una Promesa.
  // Mantenemos resolución inmediata para no complicar tests.
  return Promise.resolve(PROJECTS);
}

export function getProjectsSync(): Project[] {
  return PROJECTS;
}
