import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import React from 'react';

import { App } from '../modules/App';

describe('App', () => {
  it('renderiza el heading principal', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hola, soy/i })).toBeInTheDocument();
  });

  it('muestra los proyectos con sus tecnologías', () => {
    render(<App />);
    // Lista principal: contiene ambos títulos de proyecto
    const projectList = screen
      .getAllByRole('list')
      .find((ul) => within(ul).queryByText('Proyecto 1') && within(ul).queryByText('Proyecto 2'));
    expect(projectList).toBeTruthy();
    const items = within(projectList as HTMLElement).getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/React/)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
  });

  it('muestra el footer con el año actual', () => {
    render(<App />);
    const year = new Date().getFullYear();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toMatch(String(year));
  });
});
