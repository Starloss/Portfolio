import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { currentYear } from '@lib/date';

import { Hero } from '../components/Hero';
import { MainHeader, NAV_SECTIONS } from '../components/MainHeader';
import { ContactSection } from '../features/contact/ContactSection';
import { ExperienceSection } from '../features/experience/ExperienceSection';
import { ImpactSection } from '../features/impact/ImpactSection';
import { FeaturedProjects } from '../features/projects/FeaturedProjects';
import { SkillsSection } from '../features/skills/SkillsSection';
import { ClimaCredit } from '../components/ClimaCredit';
import { EscenaUpgrade } from '../scene/EscenaUpgrade';
import { Scene } from '../scene/Scene';

/**
 * Home · Layout B: el Hero en el cielo y un bloque por sección, con un respiro de paisaje entre
 * bloques para que se vea el Viaje de cámara.
 */
export const Home: React.FC = () => {
    // Ninguna sección marcada hasta que una cruce la parte de arriba de la pantalla.
    const [activeId, setActiveId] = useState<string>();

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined')
            return;
        const observer = new window.IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] },
        );
        for (const id of NAV_SECTIONS) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, []);

    // Al llegar con un ancla (p. ej. "← Proyectos"), el salto es instantáneo y antes de pintar: la
    // View Transition de vuelta toma el Home ya ubicado en el bloque.
    const { hash } = useLocation();
    const [initialHash] = useState(hash);
    useLayoutEffect(() => {
        const id = initialHash.replace('#', '');
        if (id)
            document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, [initialHash]);

    useEffect(() => {
        const scrollToHashSection = () => {
            const id = window.location.hash.replace('#', '');
            if (!id) return;
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        window.addEventListener('hashchange', scrollToHashSection);
        return () => window.removeEventListener('hashchange', scrollToHashSection);
    }, []);

    return (
        <>
            <Scene />
            <EscenaUpgrade />
            <MainHeader activeId={activeId} isHome />
            <main className="mx-auto max-w-[892px] space-y-[20vh] px-4 pb-[20vh] md:space-y-[35vh]">
                <Hero />
                <ImpactSection />
                <ExperienceSection />
                <FeaturedProjects />
                <SkillsSection />
                <ContactSection />
            </main>
            {/* Al final del Viaje queda sobre la Avenida Bolívar: lleva su propia superficie. */}
            <footer className="pb-10 text-center text-xs text-ink">
                <span className="rounded-full bg-surface px-3 py-1">
                    © {currentYear()} · <ClimaCredit />
                </span>
            </footer>
        </>
    );
};
