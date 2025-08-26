export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: string[];
  tech?: string[];
  location_en?: string;
  period_en?: string;
  bullets_en?: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    company: 'CORE CARE AND HEALTH SYSTEMS CORP',
    role: 'Lead Developer',
    location: 'Caracas, Venezuela',
    period: 'Oct 2022 – Presente',
    bullets: [
      'Diseñé e implementé una solución innovadora para sistemas médicos en EE.UU.',
      'Mentoricé a un equipo de 10 devs aumentando productividad en 60%.',
      'Facilité workshops logrando 100% entregas a tiempo y satisfacción del cliente.',
      'Gestioné ciclo completo: planificación, diseño, pruebas y despliegues.',
      'Lideré mejoras full-stack transformando ideas en features productivas.',
    ],
    tech: ['React', 'Node.js', 'TypeScript'],
    location_en: 'Caracas, Venezuela',
    period_en: 'Oct 2022 – Present',
    bullets_en: [
      'Designed and implemented an innovative solution for US medical systems.',
      'Mentored a 10-dev team increasing productivity by 60%.',
      'Facilitated workshops achieving 100% on-time delivery and client satisfaction.',
      'Managed full cycle: planning, design, testing and deployments.',
      'Led full-stack improvements turning ideas into productive features.',
    ],
  },
  {
    company: 'Wocoon',
    role: 'Lead Developer',
    location: 'Caracas, Venezuela',
    period: 'Jun 2021 – Mar 2023',
    bullets: [
      'Desarrollé app móvil híbrida (Ionic + Angular + Firebase) aumentando engagement.',
      'Dirigí equipo multifuncional acelerando entregas y colaboración.',
      'Implementé CI/CD reduciendo tiempos de despliegue en 70%.',
      'Diseñé modo offline asegurando alta disponibilidad.',
      'Facilité sprints alineando roadmap y aprobaciones de entregables.',
    ],
    tech: ['Ionic', 'Angular', 'Firebase', 'TypeScript'],
    location_en: 'Caracas, Venezuela',
    period_en: 'Jun 2021 – Mar 2023',
    bullets_en: [
      'Developed hybrid mobile app (Ionic + Angular + Firebase) increasing engagement.',
      'Led cross-functional team accelerating delivery and collaboration.',
      'Implemented CI/CD reducing deployment times by 70%.',
      'Designed offline mode ensuring high availability.',
      'Facilitated sprints aligning roadmap and deliverable approvals.',
    ],
  },
  {
    company: 'Daxos',
    role: 'Software Developer',
    location: 'Caracas, Venezuela',
    period: 'Ago 2020 – Oct 2022',
    bullets: [
      'Desarrollé aplicaciones full-stack con Node.js, React, Angular e Ionic.',
      'Entregué proyectos a tiempo con enfoque en calidad y mantenibilidad.',
      'Fortalecí habilidades frontend profundizando en React, Angular y Vue.',
    ],
    tech: ['Node.js', 'React', 'Angular', 'Ionic', 'Vue'],
    location_en: 'Caracas, Venezuela',
    period_en: 'Aug 2020 – Oct 2022',
    bullets_en: [
      'Built full-stack applications with Node.js, React, Angular and Ionic.',
      'Delivered projects on time focusing on quality and maintainability.',
      'Strengthened frontend skills deepening in React, Angular and Vue.',
    ],
  },
  {
    company: '300 Dev',
    role: 'Frontend Developer',
    location: 'Caracas, Venezuela',
    period: 'Sep 2018 – Ago 2020',
    bullets: [
      'Programa intensivo en Ionic 4, Angular 7, HTML5, CSS3 y TypeScript.',
      'Desarrollé soluciones para clientes internacionales (Embajada de Francia, bancos coreanos).',
      'Impulsé creatividad, resolución de problemas y trabajo en equipo en entorno ágil.',
    ],
    tech: ['Ionic', 'Angular', 'TypeScript', 'HTML5', 'CSS3'],
    location_en: 'Caracas, Venezuela',
    period_en: 'Sep 2018 – Aug 2020',
    bullets_en: [
      'Intensive program in Ionic 4, Angular 7, HTML5, CSS3 and TypeScript.',
      'Developed solutions for international clients (French Embassy, Korean banks).',
      'Boosted creativity, problem-solving and teamwork in agile environment.',
    ],
  },
];
