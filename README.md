# Portfolio

[![CI](https://github.com/Starloss/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Starloss/Portfolio/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/Starloss/Portfolio/branch/main/graph/badge.svg)](https://codecov.io/gh/Starloss/Portfolio)

Stack: React + TypeScript + Vite + TailwindCSS + ESLint (flat) + Prettier + Vitest.

## Scripts

- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build de producción en `dist/`
- `pnpm preview` - Previsualizar build
- `pnpm lint` - Linter
- `pnpm format` - Formatear con Prettier
- `pnpm test` - Ejecutar pruebas
- `pnpm test:watch` - Pruebas en modo watch
- `pnpm coverage` - Cobertura

## Estructura

```
portfolio/
  index.html
  package.json
  src/
    main.tsx
    styles.css (estilos extra mínimos)
    tailwind.css (capas base/utilidades)
  tsconfig.json
  tailwind.config.cjs
  postcss.config.cjs
  eslint.config.js
  .prettierrc
```

## Próximos pasos sugeridos

1. Ejecutar `pnpm install` para instalar dependencias.
2. Personalizar contenido en `src/modules/App.tsx`.
3. Ajustar colores/branding en `tailwind.config.cjs`.
4. Añadir datos reales (nombre, email, redes, proyectos reales).
5. Configurar deployment: (GitHub Pages, Vercel, Netlify, Cloudflare Pages...).
6. Agregar meta tags / OpenGraph / favicon.
7. Integración continua ya configurada (GitHub Actions + Codecov).

## Cobertura y calidad

- Umbrales mínimos configurados en `vitest.config.ts` (lines/statements 60%, functions 15%, branches 35%).
- Reporte HTML local: `pnpm coverage` y abrir `coverage/index.html`.
- Reporte remoto: Codecov (badge arriba). Ajusta thresholds gradualmente al aumentar cobertura real.

¡Listo para construir! ✨
