import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactSection } from '@app/features/contact/ContactSection';

import { renderWithProviders } from './render';

describe('ContactSection', () => {
    it('renderiza formulario y enlaces de iconos', () => {
        renderWithProviders(<ContactSection />);
        expect(screen.getByLabelText(/Nombre|Name/i)).toBeInTheDocument();
        // Usar role textbox para evitar colisión con el enlace cuyo aria-label también es Email
        expect(screen.getByRole('textbox', { name: /Correo|Email/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Mensaje|Message/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Enviar|Send/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Email/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /GitHub/i })).toBeInTheDocument();
    });
});
