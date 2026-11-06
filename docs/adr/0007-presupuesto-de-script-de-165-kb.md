---
status: accepted
---

# El presupuesto de script sube a 165 kB por el contenido del CV

El presupuesto de script de Lighthouse CI pasa de 160 a 165 kB y reemplaza a la [ADR 0006](0006-presupuesto-de-script-de-160-kb.md). El contenido del sitio (Trayectoria, Proyectos, skills) va en el chunk principal en los dos idiomas, porque también se renderiza en el primer pintado y genera el CV. Poner el portafolio al día con el CV actualizado (2026-11-06) sumó unos 1,2 kB de texto: CORE dividida en dos Experiencias, Logros más completos y las skills agrupadas como en el CV, con certificaciones e idiomas. `main` medía unos 159,6 kB, así que el cambio quedó en 160,8 kB.

## Considered Options

- **Recortar el texto hasta entrar en 160 kB**: el contenido dejaría de coincidir con el CV, que es la fuente de verdad del portafolio.
- **Cargar solo el idioma visitado**: liberaría varios kB de forma duradera, pero cambia cómo se carga el contenido y cómo se genera el CV, por menos de 1 kB de exceso.

## Consequences

- `lighthouserc.json` pasa a 165.000 bytes, y el README lo dice.
- Quedan unos 4 kB de margen para futuras actualizaciones de contenido. Si una actualización los agota, la siguiente opción es cargar el contenido por idioma, no otro aumento.
