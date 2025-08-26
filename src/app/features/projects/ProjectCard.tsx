import React from 'react';

import type { Project } from '@/lib/types';

interface Props {
  project: Project;
}

export const ProjectCard: React.FC<Props> = ({ project }) => (
  <li className="group rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5 hover:border-brand-500 transition-colors">
    <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-block">
      <h3 className="text-lg font-semibold text-brand-400 group-hover:underline underline-offset-4">
        {project.title}
      </h3>
    </a>
    <p className="mt-2 text-sm text-slate-400">{project.description}</p>
    {project.tech && (
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="tecnologias">
        {project.tech.map((t) => (
          <li
            key={t}
            className="text-[10px] uppercase tracking-wide bg-slate-800/80 px-2 py-1 rounded-full text-slate-300"
          >
            {t}
          </li>
        ))}
      </ul>
    )}
  </li>
);
