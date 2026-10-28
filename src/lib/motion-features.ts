// Features de motion que se cargan aparte, después del primer render. domAnimation trae el
// renderer del DOM (para los valores ligados al scroll de la Escena) y las animaciones con
// whileInView de los bloques del Home. El presupuesto de JS de Lighthouse cuenta este chunk.
import { domAnimation } from 'motion/react';

export default domAnimation;
