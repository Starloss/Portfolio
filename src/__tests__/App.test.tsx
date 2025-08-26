import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import React from 'react';
import { App } from '@app/App';

describe('App', () => {
  it('renderiza el heading principal', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hola, soy/i })).toBeInTheDocument();
  });

  it('muestra los proyectos con sus tecnologías', async () => {
    render(<App />);
    const projectList = await screen.findByRole('list', { name: /lista de proyectos/i });
    const items = within(projectList).getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // Esperar a que aparezcan tecnologías (en caso de microtask)
    await waitFor(() => {
      expect(screen.getByText(/React/)).toBeInTheDocument();
      expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
    });
  });

  it('muestra el footer con el año actual', () => {
    render(<App />);
    const year = new Date().getFullYear();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toMatch(String(year));
  });
});
