import type { GalleryImage, Localized, Project } from '../types';

const gallery = (prefix: string, items: [string, string, string][]): GalleryImage[] =>
    items.map(([n, es, en]) => ({ src: `/projects/${prefix}-${n}`, alt: { es, en } }));

const text = (es: string, en: string): Localized => ({ es, en });

// Contenido aprobado en los tickets "Caso de estudio: …". Orden = orden de Proyectos destacados.
export const PROJECTS: Project[] = [
    {
        id: 'superwallet',
        title: text('SuperWallet', 'SuperWallet'),
        experienceId: 'xhype',
        featured: true,
        start: '2025-08',
        end: '2026-04',
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
        liveUrl: 'https://superwallet.xhype.io',
        caseStudy: {
            summary: text(
                'Billetera cripto para pagar viajes, tarjetas y eSIMs, con integraciones de proveedores de viaje hasta 80% más rápidas.',
                'Crypto wallet for paying for travel, cards and eSIMs, with travel provider integrations up to 80% faster.',
            ),
            context: [
                text(
                    'SuperWallet, de XHype, es una billetera cripto auto-custodiada para gastar cripto en el mundo real: tarjetas, reservas de hoteles y actividades, gift cards y eSIMs, sin pedir datos personales.',
                    "XHype's SuperWallet is a self-custody crypto wallet for spending crypto in the real world: cards, hotel and activity bookings, gift cards and eSIMs, with no personal data required.",
                ),
            ],
            problem: text(
                'Integrar proveedores externos de viajes, lentos y heterogéneos, en una experiencia de pago con cripto que se sienta inmediata.',
                'Wiring slow, heterogeneous travel providers into a crypto checkout that feels instant.',
            ),
            role: text('Senior Developer', 'Senior Developer'),
            decisions: [
                {
                    title: text(
                        'Capa de integración de proveedores de viaje',
                        'Travel provider integration layer',
                    ),
                    explanation: text(
                        'Un modelo propio de hotel/habitación que normaliza a los proveedores, con consultas en paralelo y caché de búsquedas y tarifas. La misma capa se reusó para actividades.',
                        'An in-house hotel/room model that normalizes providers, with parallel queries and cached searches and rates. The same layer was reused for activities.',
                    ),
                },
                {
                    title: text('Menos red entre cliente y servidor', 'Less client-server traffic'),
                    explanation: text(
                        'Agregación en el backend para reducir idas y vueltas, respuestas con solo los campos necesarios y caché en el cliente para no volver a pedir lo que ya se tiene.',
                        'Backend aggregation to cut round-trips, responses with only the fields needed, and client-side caching so data already loaded is not fetched again.',
                    ),
                },
                {
                    title: text(
                        'Referidos y cupones como piezas de producto',
                        'Referrals and coupons as product levers',
                    ),
                    explanation: text(
                        'Sistema de referidos por niveles y cupones integrado al flujo de pago, para crecer sin depender solo de adquisición paga.',
                        'A tiered referral system and coupons built into checkout, to grow without relying only on paid acquisition.',
                    ),
                },
            ],
            impact: [
                {
                    metric: text('−80%', '−80%'),
                    text: text('tiempo de booking hotelero', 'hotel booking processing time'),
                },
                {
                    metric: text('−90%', '−90%'),
                    text: text('tiempo de reserva de actividades', 'activity booking time'),
                },
                {
                    metric: text('−70%', '−70%'),
                    text: text('tráfico cliente-servidor', 'client-server traffic'),
                },
            ],
            gallery: gallery('superwallet', [
                [
                    '1',
                    'Pantalla de registro de SuperWallet con las tarjetas de XHype',
                    'SuperWallet sign-up screen showing XHype cards',
                ],
                [
                    '2',
                    'Billetera con balance en USDT y tokens soportados',
                    'Wallet with USDT balance and supported tokens',
                ],
                [
                    '4',
                    'Selección de plan de tarjeta: Lite, Essential, Premium, LifeTime y Whale',
                    'Card plan selection: Lite, Essential, Premium, LifeTime and Whale',
                ],
                ['5', 'Buscador de hoteles con pago en cripto', 'Hotel search with crypto payment'],
                [
                    '6',
                    'Resultados de hoteles en Madrid con precios en USDT',
                    'Hotel results in Madrid priced in USDT',
                ],
                [
                    '7',
                    'Detalle de un hotel con galería de fotos',
                    'Hotel detail page with photo gallery',
                ],
                ['13', 'Catálogo de planes de eSIM por región', 'eSIM data plans by region'],
                ['14', 'Panel del programa de referidos', 'Referral program dashboard'],
            ]),
        },
    },
    {
        id: 'be-booking-engine',
        title: text('BE - Booking Engine', 'BE - Booking Engine'),
        experienceId: 'core',
        featured: true,
        start: '2022-10',
        tech: ['React', 'TypeScript', 'Python', 'Django', 'AWS'],
        caseStudy: {
            summary: text(
                'Plataforma interna para coordinar interpretación médica en EE.UU., de la reserva a la facturación.',
                'Internal platform coordinating medical interpretation in the US, from booking to billing.',
            ),
            context: [
                text(
                    'CORE coordina servicios de interpretación médica certificada para pacientes de compensación laboral (workers’ compensation) en EE.UU. BE es la plataforma interna donde los operadores agendan citas, asignan intérpretes, gestionan clínicas, médicos y aseguradoras, y siguen cada caso desde la reserva hasta la facturación.',
                    'CORE coordinates certified medical interpretation for workers’ compensation patients in the US. BE is the internal platform where operators schedule appointments, assign interpreters, manage clinics, providers and payers, and track every case from booking to billing.',
                ),
            ],
            problem: text(
                'Un volumen alto de reservas con muchos actores por cita, donde un dato faltante (pagador, intérprete, reporte) frena el cobro.',
                'High booking volume with many parties per appointment, where one missing piece (payer, interpreter, report) blocks billing.',
            ),
            role: text(
                'Tech Lead / Full-Stack Lead Developer',
                'Tech Lead / Full-Stack Lead Developer',
            ),
            decisions: [
                {
                    title: text('Alertas de datos faltantes', 'Missing-data alerts'),
                    explanation: text(
                        'Cada reserva marca qué le falta (caso, pagador, intérprete, seguimiento, reporte) y los operadores pueden filtrar por eso. Convierte los bloqueos de cobro en una lista de trabajo visible en vez de descubrirlos al facturar.',
                        'Every booking flags what it is missing (case, payer, interpreter, follow-up, report) and operators can filter by it. Billing blockers become a visible work queue instead of surprises at invoicing time.',
                    ),
                },
                {
                    title: text('Vista dual lista/calendario', 'Dual list/calendar view'),
                    explanation: text(
                        'La misma fuente de datos en tabla operativa (para depurar y exportar) y en agenda semanal (para detectar choques y huecos de intérpretes).',
                        'The same data as an operational table (to clean up and export) and as a weekly schedule (to spot interpreter conflicts and gaps).',
                    ),
                },
                {
                    title: text('Timeline de reclamos', 'Claim timeline'),
                    explanation: text(
                        'Las reservas se agrupan por caso de compensación con su historial de estados, para ver el recorrido completo de un paciente sin saltar entre registros.',
                        'Bookings are grouped by compensation claim with their status history, showing a patient’s full journey without jumping between records.',
                    ),
                },
                {
                    title: text(
                        'Búsqueda global de notas con etiquetas',
                        'Global tagged note search',
                    ),
                    explanation: text(
                        'Un buscador transversal con etiquetas acordadas (#NoShow, #DobleAgendado, #Rescheduled…) que convierte notas libres en información consultable.',
                        'A cross-cutting search with agreed tags (#NoShow, #DobleAgendado, #Rescheduled…) that turns free-form notes into queryable information.',
                    ),
                },
            ],
            impact: [
                {
                    metric: text('10+', '10+'),
                    text: text('devs liderados', 'developers led'),
                },
                {
                    metric: text('+36.000', '36,000+'),
                    text: text(
                        'reservas gestionadas en la plataforma',
                        'bookings managed on the platform',
                    ),
                },
            ],
            // Sin capturas: no hay permiso de CORE. El diagrama propio llega en la Fase 4.
            gallery: [],
        },
    },
    {
        id: 'wedding-invitation',
        title: text('Invitación de Boda', 'Wedding Invitation'),
        featured: true,
        start: '2026-03',
        end: '2026-03',
        tech: ['Astro', 'TypeScript', 'Firebase', 'Firestore', 'Cloud Functions', 'Vercel'],
        repositoryUrl: 'https://github.com/Starloss/wedding-invitation',
        liveUrl: 'https://wedding-invitation-seven-brown.vercel.app',
        caseStudy: {
            summary: text(
                'Invitación de boda interactiva con RSVP por código y fotos de los invitados, construida y desplegada en 1 semana.',
                'Interactive wedding invitation with code-based RSVP and guest photo uploads, built and shipped in 1 week.',
            ),
            context: [
                text(
                    'Una invitación web hecha para una boda real, que después convertí en una plantilla reutilizable con modo demo.',
                    'A web invitation built for a real wedding, later turned into a reusable template with a demo mode.',
                ),
            ],
            problem: text(
                'Confirmar asistencia por grupo con cupos limitados sin pedir cuentas a los invitados, y reunir en un solo lugar fotos y canciones del evento, todo en una semana.',
                'Collecting RSVPs per group with limited seats without asking guests to sign up, and gathering event photos and songs in one place, all within a week.',
            ),
            role: text(
                'Full-Stack Developer (Proyecto personal)',
                'Full-Stack Developer (Personal project)',
            ),
            decisions: [
                {
                    title: text('RSVP por token, sin login', 'Token-based RSVP, no login'),
                    explanation: text(
                        'Cada invitación lleva un código único que valida al grupo y su cupo en Firestore: los invitados confirman sin crear cuentas y el anfitrión controla cuántos asisten.',
                        'Each invitation carries a unique code that validates the group and its seat limit in Firestore: guests RSVP without creating accounts and the host controls how many attend.',
                    ),
                },
                {
                    title: text('Astro mobile-first', 'Astro mobile-first'),
                    explanation: text(
                        'Casi todos abren el enlace desde el celular: sitio mayormente estático, con interactividad solo en la cuenta regresiva, el RSVP y la galería, para que cargue rápido.',
                        'Almost everyone opens the link on their phone: a mostly static site, with interactivity only in the countdown, RSVP and gallery, so it loads fast.',
                    ),
                },
                {
                    title: text('Seguridad en reglas de Firebase', 'Security in Firebase rules'),
                    explanation: text(
                        'Sin backend propio: las reglas de Firestore y Storage definen quién puede leer, confirmar o subir fotos. Permitió salir a producción en una semana sin un servidor que mantener.',
                        'No custom backend: Firestore and Storage rules define who can read, RSVP or upload photos. It made it possible to ship in a week with no server to maintain.',
                    ),
                },
                {
                    title: text(
                        'Cloud Functions para automatizar',
                        'Cloud Functions for automation',
                    ),
                    explanation: text(
                        'Envío de invitaciones y recordatorios programados, para no perseguir confirmaciones a mano.',
                        'Sending invitations and scheduled reminders, so nobody has to chase RSVPs by hand.',
                    ),
                },
            ],
            impact: [
                {
                    metric: text('1 semana', '1 week'),
                    text: text(
                        'diseñada, implementada y desplegada',
                        'designed, built and shipped',
                    ),
                },
            ],
            gallery: gallery('wedding-invitation', [
                ['11', 'Portada de la invitación en escritorio', 'Invitation cover on desktop'],
                ['1', 'Portada de la invitación en móvil', 'Invitation cover on mobile'],
                [
                    '3',
                    'Día, lugar y dirección del evento en móvil',
                    'Event date, venue and address on mobile',
                ],
                [
                    '4',
                    'Confirmación de asistencia con código de invitación',
                    'RSVP with an invitation code',
                ],
                ['13', 'Galería de retratos de la pareja', 'Couple portrait gallery'],
                [
                    '8',
                    'Código QR para que los invitados suban fotos',
                    'QR code for guests to upload photos',
                ],
                [
                    '18',
                    'Panel del anfitrión con invitaciones y confirmaciones',
                    'Host dashboard with invitations and RSVPs',
                ],
                [
                    '19',
                    'Formulario para crear una invitación con cupos',
                    'Form to create an invitation with seat limits',
                ],
            ]),
        },
    },
];
