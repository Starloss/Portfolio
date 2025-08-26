import { describe, it, expect, beforeAll } from 'vitest';
import { screen } from '@testing-library/react';

describe('main bootstrap', () => {
  beforeAll(() => {
    if (!window.matchMedia) {
      // @ts-expect-error mock
      window.matchMedia = () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }
  });
  it('renderiza el heading principal tras importar main', async () => {
    const rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);
    await import('../main');
    const heading = await screen.findByRole('heading', { name: /hola, soy/i });
    expect(heading).toBeInTheDocument();
  });
});
