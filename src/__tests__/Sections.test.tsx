import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { SkillsSection } from '@app/features/skills/SkillsSection';
import { ExperienceSection } from '@app/features/experience/ExperienceSection';

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

    it('renderiza ExperienceSection con todas las Experiencias, de la más reciente a la más antigua', () => {
        renderWithProviders(<ExperienceSection />, 'en');
        const expList = screen.getByRole('list', { name: /lista de experiencias/i });
        const topLevel = within(expList)
            .getAllByRole('listitem')
            .filter((li) => li.parentElement === expList);
        expect(topLevel.map((li) => li.querySelector('h3')?.textContent)).toEqual([
            'Senior Developer · XHype',
            'Lead Developer · CORE Care and Health Systems',
            'Lead Developer · Wocoon',
            'Software Developer · Daxos',
            'Frontend Developer · 300 Dev',
        ]);
        expect(within(topLevel[1]).getByText('Oct 2022 – Present')).toBeInTheDocument();
    });
});
