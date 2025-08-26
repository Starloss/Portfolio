import React from 'react';
import { useI18n } from '@lib/i18n';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
  const projects = getProjectsSync();
  const { t } = useI18n();
  return (
    <ul className="grid md:grid-cols-2 gap-6" aria-label={t('projects_list_aria')}>
      {projects.map((p) => (
        <ProjectCard key={p.title} project={p} />
      ))}
    </ul>
  );
};
