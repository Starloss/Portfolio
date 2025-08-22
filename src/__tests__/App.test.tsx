import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { App } from '../modules/App';

describe('App', () => {
  it('renderiza el heading principal', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hola, soy/i })).toBeInTheDocument();
  });
});
