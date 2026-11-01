// El Clima en la Escena SVG: solo un tinte de cielo, con un fundido. Dos capas fijas a las que solo se
// les cambia la opacidad, para no repintar. Es lo que ven los teléfonos y quien pide menos movimiento.
import React from 'react';
import { useClima, type Estado } from '@lib/clima';

// Cuánto cubre cada estado. El tope, en tormenta, deja ver la Bóveda celeste y hace que el texto de
// Día, que va sobre el cielo, mantenga el contraste (e2e/clima.spec.ts).
const TINT: Record<Estado, number> = {
    despejado: 0,
    parcial: 0.12,
    nublado: 0.35,
    lluvia: 0.5,
    tormenta: 0.6,
};

// Las nubes de la capa SVG son claras: un cielo despejado no las tiene, y con mal tiempo se apagan.
const CLOUDS: Record<Estado, number> = {
    despejado: 0,
    parcial: 1,
    nublado: 1,
    lluvia: 0.6,
    tormenta: 0.4,
};

/** Cuánto se ven las nubes de la capa SVG; sin Clima, como siempre. */
export const cloudsOpacity = (estado: Estado | null) => (estado ? CLOUDS[estado] : 1);

export const ClimaTint: React.FC<{ night: boolean }> = ({ night }) => {
    const clima = useClima();
    const tint = clima ? TINT[clima.estado] : 0;
    return (
        <>
            <div className="scene-tint scene-tint-day" style={{ opacity: night ? 0 : tint }} />
            <div className="scene-tint scene-tint-night" style={{ opacity: night ? tint : 0 }} />
        </>
    );
};
