import React, { useId, useState } from 'react';
import { m } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '@lib/motion';

interface BlockProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

/**
 * Un bloque del Home sobre la Escena: superficie translúcida sin blur, con su título. Entra con
 * un fundido y un desplazamiento corto la primera vez que aparece; con reduced-motion, sin animar.
 * Si se llega a la página apuntando a este bloque (p. ej. "← Proyectos"), ya está visible: el
 * morph de vuelta desde el Caso de estudio necesita la tarjeta en su lugar desde el primer cuadro.
 */
export const Block: React.FC<BlockProps> = ({ id, title, children }) => {
    const reduce = usePrefersReducedMotion();
    const { hash } = useLocation();
    const [arrivedHere] = useState(() => hash === `#${id}`);
    const headingId = useId();
    return (
        <m.section
            id={id}
            aria-labelledby={headingId}
            initial={reduce || arrivedHere ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="scroll-mt-24 rounded-2xl border border-line bg-surface p-6 md:p-8 space-y-6"
        >
            <h2 id={headingId} className="text-2xl md:text-3xl text-ink">
                {title}
            </h2>
            {children}
        </m.section>
    );
};

/** Chip de una tecnología o skill. */
export const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="rounded-full border border-line px-2.5 py-1 text-xs text-ink">{children}</li>
);
