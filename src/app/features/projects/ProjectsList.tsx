import React from 'react';

import { getProjectsSync } from './data';
import { ProjectCard } from './ProjectCard';

export const ProjectsList: React.FC = () => {
  const projects = getProjectsSync();
  return (
    <ul className="grid md:grid-cols-2 gap-6" aria-label="lista de proyectos">
      {projects.map((p) => (
        <ProjectCard key={p.title} project={p} />
      ))}
    </ul>
  );
};
