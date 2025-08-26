import React from 'react';
import { currentYear } from '@lib/date';

import { SITE_AUTHOR, CONTACT_EMAIL } from './config/site';
import { ProjectsList } from './features/projects/ProjectsList';

export const App: React.FC = () => (
  <>
    <header className="px-6 pt-14 pb-10 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Hola, soy <span className="text-brand-400">{SITE_AUTHOR}</span>
      </h1>
      <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
        Desarrollador Web / Software Engineer
      </p>
    </header>
    <main className="px-6 max-w-5xl mx-auto space-y-24 pb-24">
      <section id="about" className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Sobre mí <span className="h-px grow bg-slate-700" />
        </h2>
        <p className="leading-relaxed text-slate-300">
          Breve descripción. Edita{' '}
          <code className="px-1.5 py-0.5 bg-slate-800 rounded">src/app/App.tsx</code> para comenzar.
        </p>
      </section>
      <section id="projects" className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Proyectos <span className="h-px grow bg-slate-700" />
        </h2>
        <ProjectsList />
      </section>
      <section id="contact" className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Contacto <span className="h-px grow bg-slate-700" />
        </h2>
        <p>
          <a className="text-brand-400 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </main>
    <footer className="text-center text-xs text-slate-500 pb-10">
      © {currentYear()} {SITE_AUTHOR}
    </footer>
  </>
);
