# Portfolio

Stack: React + TypeScript + Vite + TailwindCSS + ESLint + Prettier.

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
  .eslintrc.cjs
  .prettierrc
```

## Próximos pasos sugeridos
1. Ejecutar `pnpm install` para instalar dependencias.
2. Personalizar contenido en `src/modules/App.tsx`.
3. Ajustar colores/branding en `tailwind.config.cjs`.
4. Añadir datos reales (nombre, email, redes, proyectos reales).
5. Configurar deployment: (GitHub Pages, Vercel, Netlify, Cloudflare Pages...).
6. Agregar meta tags / OpenGraph / favicon.
7. (Opcional) Añadir testing (Vitest + Testing Library) e integración continua.

¡Listo para construir! ✨
