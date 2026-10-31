// PROTOTIPO desechable: la versión SVG del Clima, solo un tinte de cielo que entra con un fundido.
// Es lo que ven el móvil y quien pide menos movimiento: no llueve ni hay rayos.
import React from 'react';

import { climaTarget, type ClimaParams } from './clima';

export const ClimaTint: React.FC<{ night: boolean; params: ClimaParams }> = ({ night, params }) => {
    const { cover, dark } = climaTarget(params);
    const shade = 1 - dark * 0.6;
    const [r, g, b] = (night ? [14, 19, 31] : [161, 176, 189]).map((c) => Math.round(c * shade));
    const low = params.variant === 'c';
    const mask = low ? 'linear-gradient(to bottom, transparent 25%, #000 75%)' : undefined;
    return (
        <div
            data-part="prototipo-clima"
            className="scene-layer"
            style={{
                background: `rgb(${r}, ${g}, ${b})`,
                opacity: Math.min(1, cover * 0.75 + dark * 0.25),
                transition: 'opacity 1.5s ease, background-color 1.5s ease',
                maskImage: mask,
                WebkitMaskImage: mask,
            }}
        />
    );
};
