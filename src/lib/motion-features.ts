// Features de motion que se cargan aparte, después del primer render. domMin trae el renderer
// del DOM, que los componentes `m` necesitan para seguir valores ligados al scroll, y las
// animaciones, sin los gestos de domAnimation: el presupuesto de JS de Lighthouse cuenta
// también este chunk.
import { domMin } from 'motion/react';

export default domMin;
