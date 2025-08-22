import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

describe('main bootstrap', () => {
  it('renderiza el heading principal tras importar main', async () => {
    const rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);
    await import('../main');
    const heading = await screen.findByRole('heading', { name: /hola, soy/i });
    expect(heading).toBeInTheDocument();
  });
});
