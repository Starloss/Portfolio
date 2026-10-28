import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { SkillsSection } from '@app/features/skills/SkillsSection';

import { renderWithProviders } from './render';

describe('Secciones adicionales', () => {
    it('renderiza SkillsSection con todas las categorías', () => {
        renderWithProviders(<SkillsSection />);
        for (const name of ['Front', 'Back', 'DevOps', 'Habilidades blandas']) {
            expect(screen.getByRole('heading', { name })).toBeInTheDocument();
            const list = screen.getByRole('list', { name: `skills de ${name}` });
            expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
        }
        expect(screen.getByText('Liderazgo')).toBeInTheDocument();
    });
});
