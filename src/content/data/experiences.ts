import type { Experience } from '../types';

const CARACAS = { es: 'Caracas, Venezuela', en: 'Caracas, Venezuela' };

// Trayectoria normalizada (ticket "Normalizar la Trayectoria"). Los 2 primeros Logros de cada
// Experiencia son los que muestra el Home (ticket "Layout del Home sobre la Escena").
export const EXPERIENCES: Experience[] = [
    {
        id: 'xhype',
        company: 'XHype',
        role: { es: 'Senior Developer', en: 'Senior Developer' },
        location: { es: 'Remoto', en: 'Remote' },
        start: '2025-08',
        end: '2026-04',
        achievements: [
            {
                text: {
                    es: 'Desarrollé integraciones con APIs externas para el booking de hoteles y actividades en SuperWallet, reduciendo de forma drástica los tiempos de procesamiento.',
                    en: 'Built external API integrations for hotel and activity booking in SuperWallet, drastically cutting processing times.',
                },
            },
            {
                text: {
                    es: 'Construí funcionalidades clave de producto, como referidos y cupones, y optimicé la comunicación cliente-servidor.',
                    en: 'Built key product features such as referrals and coupons, and optimized client-server communication.',
                },
            },
            {
                text: {
                    es: 'Participé en decisiones de flujo y mejoras de UI/UX del producto.',
                    en: 'Contributed to product flow decisions and UI/UX improvements.',
                },
            },
        ],
        tech: ['React', 'TypeScript', 'Prisma', 'Nest'],
    },
    {
        id: 'core',
        company: 'CORE Care and Health Systems',
        role: { es: 'Lead Developer', en: 'Lead Developer' },
        location: CARACAS,
        start: '2022-10',
        achievements: [
            {
                text: {
                    es: 'Lidero y mentoreo a un equipo de más de 10 devs, aumentando su productividad en 60%.',
                    en: 'I lead and mentor a team of 10+ developers, increasing their productivity by 60%.',
                },
            },
            {
                text: {
                    es: 'Facilité workshops logrando 100% entregas a tiempo y satisfacción del cliente.',
                    en: 'Facilitated workshops achieving 100% on-time delivery and client satisfaction.',
                },
            },
            {
                text: {
                    es: 'Diseñé e implementé una solución innovadora para sistemas médicos en EE.UU.',
                    en: 'Designed and implemented an innovative solution for US medical systems.',
                },
            },
            {
                text: {
                    es: 'Gestioné ciclo completo: planificación, diseño, pruebas y despliegues.',
                    en: 'Managed full cycle: planning, design, testing and deployments.',
                },
            },
            {
                text: {
                    es: 'Lideré mejoras full-stack transformando ideas en features productivas.',
                    en: 'Led full-stack improvements turning ideas into productive features.',
                },
            },
        ],
        tech: ['React', 'Node.js', 'TypeScript'],
    },
    {
        id: 'wocoon',
        company: 'Wocoon',
        role: { es: 'Lead Developer', en: 'Lead Developer' },
        location: CARACAS,
        start: '2021-06',
        end: '2023-03',
        achievements: [
            {
                text: {
                    es: 'Implementé CI/CD reduciendo tiempos de despliegue en 70%.',
                    en: 'Implemented CI/CD reducing deployment times by 70%.',
                },
            },
            {
                text: {
                    es: 'Desarrollé app móvil híbrida (Ionic + Angular + Firebase) aumentando engagement.',
                    en: 'Developed hybrid mobile app (Ionic + Angular + Firebase) increasing engagement.',
                },
            },
            {
                text: {
                    es: 'Dirigí equipo multifuncional acelerando entregas y colaboración.',
                    en: 'Led cross-functional team accelerating delivery and collaboration.',
                },
            },
            {
                text: {
                    es: 'Diseñé modo offline asegurando alta disponibilidad.',
                    en: 'Designed offline mode ensuring high availability.',
                },
            },
            {
                text: {
                    es: 'Facilité sprints alineando roadmap y aprobaciones de entregables.',
                    en: 'Facilitated sprints aligning roadmap and deliverable approvals.',
                },
            },
        ],
        tech: ['Ionic', 'Angular', 'Firebase', 'TypeScript'],
    },
    {
        id: 'daxos',
        company: 'Daxos',
        role: { es: 'Software Developer', en: 'Software Developer' },
        location: CARACAS,
        start: '2020-08',
        end: '2022-10',
        achievements: [
            {
                text: {
                    es: 'Desarrollé aplicaciones full-stack con Node.js, React, Angular e Ionic.',
                    en: 'Built full-stack applications with Node.js, React, Angular and Ionic.',
                },
            },
            {
                text: {
                    es: 'Entregué proyectos a tiempo con enfoque en calidad y mantenibilidad.',
                    en: 'Delivered projects on time focusing on quality and maintainability.',
                },
            },
            {
                text: {
                    es: 'Fortalecí habilidades frontend profundizando en React, Angular y Vue.',
                    en: 'Strengthened frontend skills deepening in React, Angular and Vue.',
                },
            },
        ],
        tech: ['Node.js', 'React', 'Angular', 'Ionic', 'Vue'],
    },
    {
        id: '300-dev',
        company: '300 Dev',
        role: { es: 'Frontend Developer', en: 'Frontend Developer' },
        location: CARACAS,
        start: '2018-09',
        end: '2020-08',
        achievements: [
            {
                text: {
                    es: 'Desarrollé aplicaciones web y móviles con Ionic 4, Angular 7 y TypeScript, comenzando en un programa intensivo de formación dentro de la empresa.',
                    en: 'Built web and mobile applications with Ionic 4, Angular 7 and TypeScript, starting through an intensive in-company training program.',
                },
            },
            {
                text: {
                    es: 'Desarrollé soluciones para clientes internacionales (Embajada de Francia, bancos coreanos).',
                    en: 'Developed solutions for international clients (French Embassy, Korean banks).',
                },
            },
            {
                text: {
                    es: 'Impulsé creatividad, resolución de problemas y trabajo en equipo en entorno ágil.',
                    en: 'Boosted creativity, problem-solving and teamwork in agile environment.',
                },
            },
        ],
        tech: ['Ionic', 'Angular', 'TypeScript', 'HTML5', 'CSS3'],
    },
];
