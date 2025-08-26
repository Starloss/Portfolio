import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SkillsSection } from '@app/features/skills/SkillsSection';
import { SKILL_CATEGORIES } from '@app/features/skills/data';
import { ExperienceSection } from '@app/features/experience/ExperienceSection';
import { EXPERIENCE } from '@app/features/experience/data';
import { I18nProvider } from '@lib/i18n';

describe('Secciones adicionales', () => {
  it('renderiza SkillsSection con todas las categorías', () => {
    render(
      <I18nProvider>
        <SkillsSection />
      </I18nProvider>,
    );
    SKILL_CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('heading', { name: cat.name })).toBeInTheDocument();
    });
    // Cada categoría tiene su lista
    SKILL_CATEGORIES.forEach((cat) => {
      const list = screen.getByRole('list', { name: new RegExp(`skills de ${cat.name}`, 'i') });
      const pills = within(list).getAllByRole('listitem');
      expect(pills.length).toBeGreaterThan(0);
    });
  });

  it('renderiza ExperienceSection con todas las experiencias', () => {
    render(
      <I18nProvider>
        <ExperienceSection />
      </I18nProvider>,
    );
    const expList = screen.getByRole('list', { name: /lista de experiencias/i });
    const allItems = within(expList).getAllByRole('listitem');
    const topLevel = allItems.filter((li) => li.parentElement === expList);
    expect(topLevel.length).toBe(EXPERIENCE.length);
    EXPERIENCE.forEach((e) => {
      expect(screen.getByText(new RegExp(e.company, 'i'))).toBeInTheDocument();
    });
  });
});
