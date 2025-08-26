export interface SkillCategory {
  name: string;
  items: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  { name: 'Frontend', items: ['React', 'Angular', 'Ionic', 'TypeScript', 'Vue', 'HTML5', 'CSS3'] },
  { name: 'Backend', items: ['Node.js', 'Firebase'] },
  { name: 'DevOps / CI', items: ['CI/CD Pipelines'] },
  {
    name: 'Soft Skills',
    items: ['Leadership', 'Mentoring', 'Problem-solving', 'Communication', 'Planning'],
  },
];
