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
                    es: 'Desarrollé integraciones con APIs externas para el booking de hoteles y actividades en SuperWallet, reduciendo en 80% el tiempo de procesamiento del booking hotelero.',
                    en: 'Built external API integrations for hotel and activity booking in SuperWallet, cutting hotel booking processing time by 80%.',
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
        start: '2023-10',
        achievements: [
            {
                text: {
                    es: 'Lidero y mentoreo a más de 10 devs que me reportan: contratación y entrevistas técnicas, one-on-ones, planes de crecimiento, evaluaciones de desempeño y manejo de bajo rendimiento. La productividad del equipo subió 60%.',
                    en: 'Lead and mentor 10+ developers who report to me: hiring and technical interviews, one-on-ones, growth plans, performance reviews and managing underperformance. Team productivity rose 60%.',
                },
            },
            {
                text: {
                    es: 'Subí la vara de calidad con una meta de 80%+ de cobertura y pruebas unitarias, de integración, E2E, de contrato y de mutación: los errores críticos del día 1 por release bajaron de unos 5 a 0, y los menores de más de 20 a unos 5.',
                    en: 'Raised the quality bar with an 80%+ code coverage target and unit, integration, E2E, contract and mutation testing: critical day-1 production errors per release fell from about 5 to 0, and minor ones from 20+ to about 5.',
                },
            },
            {
                text: {
                    es: 'Construí flujos de orquestación de agentes especializados por tarea para automatizar trabajo, y lidero la adopción de las skills de Matt Pocock para Claude Code en el equipo.',
                    en: 'Built orchestration flows of task-specialized agents for automation and lead the team’s adoption of Matt Pocock’s skills for Claude Code.',
                },
            },
            {
                text: {
                    es: 'Soy el Scrum Master del equipo (dailies, sprint planning, sprint reviews, brainstorming), dirijo sus reuniones y planifico todo el trabajo, del frontend a DevOps.',
                    en: 'Act as the team’s Scrum Master (dailies, sprint planning, sprint reviews, brainstorming), run team meetings and plan all work from frontend to DevOps.',
                },
            },
            {
                text: {
                    es: 'Trabajo a diario con el product manager en prioridades y trade-offs, y me reúno con clientes y stakeholders; facilité workshops logrando 100% de entregas a tiempo y satisfacción del cliente.',
                    en: 'Partner daily with the product manager on priorities and trade-offs and meet clients and stakeholders regularly; facilitated workshops achieving 100% on-time delivery and client satisfaction.',
                },
            },
            {
                text: {
                    es: 'Diseñé e implementé una solución para sistemas médicos en EE.UU., con el ciclo completo: planificación, diseño, pruebas y despliegue.',
                    en: 'Designed and implemented a solution for US medical systems, owning the full cycle from planning and design to testing and deployment.',
                },
            },
        ],
        tech: ['React', 'Node.js', 'TypeScript'],
    },
    {
        id: 'core-fullstack',
        company: 'CORE Care and Health Systems',
        role: { es: 'Full-stack Developer', en: 'Full-stack Developer' },
        location: CARACAS,
        start: '2022-10',
        end: '2023-10',
        achievements: [
            {
                text: {
                    es: 'Implementé funcionalidades de la plataforma con Python, Django, React y TypeScript.',
                    en: 'Implemented platform features with Python, Django, React and TypeScript.',
                },
            },
            {
                text: {
                    es: 'Probé y depuré el sistema junto al lead developer; me ascendieron a Lead Developer en octubre de 2023.',
                    en: 'Tested and debugged the system alongside the lead developer; promoted to Lead Developer in October 2023.',
                },
            },
        ],
        tech: ['Python', 'Django', 'React', 'TypeScript'],
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
                    es: 'Lideré un equipo multidisciplinario de hasta 5 personas (devs y una diseñadora), tomando las decisiones técnicas clave, de la arquitectura del sistema a las buenas prácticas de desarrollo.',
                    en: 'Led a multidisciplinary team of up to 5 (developers and a designer), making key technical decisions from system architecture to development best practices.',
                },
            },
            {
                text: {
                    es: 'Desarrollé una app móvil híbrida (Ionic + Angular + Firebase) que aumentó el engagement, y diseñé un modo offline que asegura alta disponibilidad.',
                    en: 'Developed a hybrid mobile app (Ionic + Angular + Firebase), increasing engagement, and designed an offline mode ensuring high availability.',
                },
            },
            {
                text: {
                    es: 'Facilité sprints alineando el roadmap y las aprobaciones de entregables, con comunicación regular con los stakeholders.',
                    en: 'Facilitated sprints aligning roadmap and deliverable approvals, with regular stakeholder communication.',
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
                    es: 'Desarrollé aplicaciones full-stack con Node.js, React, Angular e Ionic como único desarrollador en varios proyectos simultáneos.',
                    en: 'Built full-stack applications with Node.js, React, Angular and Ionic as the sole developer on multiple simultaneous projects.',
                },
            },
            {
                text: {
                    es: 'Entregué proyectos a tiempo con enfoque en calidad y mantenibilidad.',
                    en: 'Delivered projects on time, focusing on quality and maintainability.',
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
                    es: 'Desarrollé soluciones para clientes internacionales (Embajada de Francia, bancos coreanos) en un entorno ágil.',
                    en: 'Developed solutions for international clients (French Embassy, Korean banks) in an agile environment.',
                },
            },
        ],
        tech: ['Ionic', 'Angular', 'TypeScript', 'HTML5', 'CSS3'],
    },
];
