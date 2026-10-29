import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Gallery } from '@app/features/projects/Gallery';
import { ProjectCover } from '@app/features/projects/ProjectCover';

import { BE_INDEX, withDiagram } from './diagram-fixture';
import { renderWithProviders } from './render';

import { resolveContent } from '@/content';

// Un Proyecto sin capturas publicables usa su Diagrama como Portada (GLOSSARY.md).
const projectWithDiagram = (locale: 'es' | 'en') =>
    resolveContent(locale, new Date(2026, 9, 29), withDiagram()).projects[BE_INDEX];

describe('Diagrama de un Proyecto sin capturas', () => {
    it('es la Portada: los pasos del ciclo como una sola imagen con su texto alternativo', () => {
        renderWithProviders(
            <ProjectCover project={projectWithDiagram('en')} sizes="100vw" />,
            'en',
        );
        const diagram = screen.getByRole('img', {
            name: "A booking's lifecycle: booking, interpreter assignment, service, report and billing",
        });
        expect(diagram).toHaveTextContent('Interpreter assignment');
    });

    it('en el lugar de la galería explica por qué no hay capturas, sin visor', () => {
        renderWithProviders(<Gallery id="gallery" project={projectWithDiagram('es')} />);
        const gallery = screen.getByRole('region', { name: 'Galería' });
        expect(gallery).toHaveTextContent(
            'Sin capturas: el sistema es interno. El diagrama resume el ciclo de una reserva.',
        );
        expect(within(gallery).queryAllByRole('button')).toEqual([]);
    });
});
