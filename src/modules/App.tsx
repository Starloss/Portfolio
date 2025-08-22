import React from 'react';

export interface Project {
  title: string;
  url: string;
  description: string;
  tech?: string[];
}

const projects: Project[] = [
  { title: 'Proyecto 1', url: '#', description: 'Descripción corta', tech: ['React', 'TypeScript'] },
  { title: 'Proyecto 2', url: '#', description: 'Descripción corta', tech: ['Node', 'Express'] }
];

export const App: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <>
      <header className="px-6 pt-14 pb-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Hola, soy <span className="text-brand-400">Tu Nombre</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">Desarrollador Web / Software Engineer</p>
      </header>

      <main className="px-6 max-w-5xl mx-auto space-y-24 pb-24">
        <section id="about" className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            Sobre mí <span className="h-px grow bg-slate-700" />
          </h2>
          <p className="leading-relaxed text-slate-300">
            Breve descripción. Edita{' '}
            <code className="px-1.5 py-0.5 bg-slate-800 rounded">src/modules/App.tsx</code> para comenzar.
          </p>
        </section>

        <section id="projects" className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            Proyectos <span className="h-px grow bg-slate-700" />
          </h2>
          <ul className="grid md:grid-cols-2 gap-6">
            {projects.map((p) => (
              <li
                key={p.title}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5 hover:border-brand-500 transition-colors"
              >
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <h3 className="text-lg font-semibold text-brand-400 group-hover:underline underline-offset-4">
                    {p.title}
                  </h3>
                </a>
                <p className="mt-2 text-sm text-slate-400">{p.description}</p>
                {p.tech && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
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
            ))}
          </ul>
        </section>

        <section id="contact" className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            Contacto <span className="h-px grow bg-slate-700" />
          </h2>
          <p>
            <a className="text-brand-400 hover:underline" href="mailto:tuemail@example.com">
              tuemail@example.com
            </a>
          </p>
        </section>
      </main>
      <footer className="text-center text-xs text-slate-500 pb-10">© {year} Tu Nombre</footer>
    </>
  );
};
