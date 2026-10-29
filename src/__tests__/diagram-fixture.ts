import { CONTENT, type Content } from '@/content';

// Ningún Proyecto real usa hoy un Diagrama (BE pasó a tener capturas), pero el sitio lo sigue
// soportando para el próximo sistema interno sin capturas publicables. Este fixture le quita las
// capturas a BE y le devuelve el Diagrama que tenía.
export const BE_INDEX = 1;

export function withDiagram(content: Content = structuredClone(CONTENT)): Content {
    const be = content.projects[BE_INDEX].caseStudy;
    be.gallery = [];
    be.diagram = {
        steps: [
            { es: 'Reserva', en: 'Booking' },
            { es: 'Asignación de intérprete', en: 'Interpreter assignment' },
            { es: 'Servicio', en: 'Service' },
            { es: 'Reporte', en: 'Report' },
            { es: 'Facturación', en: 'Billing' },
        ],
        alt: {
            es: 'Ciclo de una reserva: reserva, asignación de intérprete, servicio, reporte y facturación',
            en: "A booking's lifecycle: booking, interpreter assignment, service, report and billing",
        },
        noScreenshots: {
            es: 'Sin capturas: el sistema es interno. El diagrama resume el ciclo de una reserva.',
            en: "No screenshots: the system is internal. The diagram summarizes a booking's lifecycle.",
        },
    };
    return content;
}
