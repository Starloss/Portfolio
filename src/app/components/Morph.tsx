import React, { ViewTransition } from 'react';
import { usePrefersReducedMotion } from '@lib/motion';

/**
 * Elemento compartido entre la tarjeta de un Proyecto destacado y su Caso de estudio: al navegar,
 * el que se va se transforma en el que llega con el mismo nombre. Con reduced-motion no hay
 * ningún <ViewTransition>, así que React no inicia la transición y la navegación es instantánea.
 */
export const Morph: React.FC<{ name: string; children: React.ReactNode }> = ({
    name,
    children,
}) => {
    const reduce = usePrefersReducedMotion();
    if (reduce) return <>{children}</>;
    return <ViewTransition name={name}>{children}</ViewTransition>;
};

export const coverTransition = (projectId: string) => `portada-${projectId}`;
export const titleTransition = (projectId: string) => `titulo-${projectId}`;
