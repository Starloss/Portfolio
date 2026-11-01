# Diego Rangel · Portfolio

[![CI](https://github.com/Starloss/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Starloss/Portfolio/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/Starloss/Portfolio/branch/main/graph/badge.svg)](https://codecov.io/gh/Starloss/Portfolio)

**Live:** [www.diegorangel.dev](https://www.diegorangel.dev)

The personal site of Diego Rangel, a Full-Stack Lead Developer. It is written for recruiters and hiring managers. It presents his work history and the products he has built or helped build, told as case studies, over an animated scene of Caracas that moves as you scroll. It is bilingual: Spanish at `/`, English at `/en`.

## Stack

- **React 19** with **TypeScript 5**, built by **Vite 8**, routed with **React Router 7**
- **Tailwind CSS 4** and design tokens checked for WCAG contrast
- **motion** for the scroll-driven camera, loaded lazily; React's `<ViewTransition>` for the card-to-case-study morph
- **Vitest 5** and Testing Library for unit tests, **Playwright** for end-to-end tests
- **@react-pdf/renderer** and **@resvg/resvg-js** at build time, for the CV and the Open Graph images; **sharp** for the responsive WebP screenshots, which are generated once and committed
- **Umami Cloud** for cookieless analytics; the site itself is deployed on **Vercel**

## Technical decisions

The decisions are recorded as ADRs in [`docs/adr/`](docs/adr). They are written in Spanish, like the domain glossary in [`GLOSSARY.md`](GLOSSARY.md).

- **The scene is layered SVG, with a WebGL version on capable devices** ([ADR 0003](docs/adr/0003-escena-webgl-sobre-la-svg.md), which replaces [ADR 0001](docs/adr/0001-escena-svg-por-capas-sin-webgl.md)). El Ávila, the other landmarks and the skyline are SVG silhouettes in separate layers, and scroll moves each layer with a compositor-friendly `transform`. El Ávila's profile is generated from real NASA SRTM elevation data by `scripts/avila-profile.ts`. The SVG always paints first. After load, a tiny deferred check looks at the device (reduced motion, Save-Data, WebGL2, memory, cores, GPU). On a capable device, phones included, it loads a WebGL version built with `ogl`, which draws from a Web Worker on an `OffscreenCanvas` (so it never blocks the page), uses the same SVG parts rasterized as textures, and cross-fades in at the current scroll position. On top of the SVG scene it adds volumetric clouds and mist, sunset and sunrise light when the theme changes, a living night city, mouse parallax, and traffic and people moving along the Avenida Bolívar, the street the camera journey ends on (still in the SVG version). An FPS watchdog fades it back to the SVG if it runs slow, and remembers that for the visitor. For testing, `?escena=webgl` forces the WebGL version on any device and skips the check and the watchdog; `?escena=svg` forces the SVG.
- **The theme follows the hour in Caracas, not the system preference** ([ADR 0004](docs/adr/0004-tema-inicial-por-la-hora-de-caracas.md)). A small inline script sets it before the first paint, from whether the sun is above the horizon there. The toggle wins for the rest of that visit. For testing, `?hora=HH:MM` replaces the clock. The sun and the moon follow their real path over Caracas, computed without a network or a dependency, and changing the theme turns the whole sky.
- **The weather is live, from the browser** ([ADR 0005](docs/adr/0005-clima-desde-el-navegador-con-open-meteo.md)). After the first paint the site asks Open-Meteo for the weather in Caracas, caches it for 30 minutes, and shows it in the Hero and the sky: clouds, rain and lightning in the WebGL version, a tint of the sky in the SVG one. If the request fails, the page just shows the hour. For testing, `?clima=despejado|parcial|nublado|lluvia|tormenta` replaces the data and skips the request.
- **Analytics run on Umami, not Vercel Web Analytics** ([ADR 0002](docs/adr/0002-analitica-con-umami-no-vercel.md)). The site measures the actions that signal hiring interest: CV downloads, clicks to email or LinkedIn, and case-study views. On Vercel, custom events need a paid plan. Umami is free, sets no cookies and only records data on the production domain. Links inside the CV carry UTM tags.
- **One content source, many outputs.** Work history, projects and case studies live as typed, bilingual data in `src/content/data/`. That data drives the pages and, at build time, the CV PDF in each language, a per-route `<head>` (title, description, canonical, `hreflang`, Open Graph), the Open Graph images, the sitemap and `robots.txt`.
- **Content is validated at build time.** The build fails on any unconfirmed claim, missing translation, or screenshot without published files or known dimensions. Nothing unverified ships.

## Quality gates

Every pull request runs these checks in CI:

- **Lighthouse CI** on the home page in both languages and every case study (Spanish routes), at mobile settings. Performance and accessibility must score **≥ 90**. Transfer budgets: **157 kB** of script, **15 kB** of CSS and **30 kB** of fonts. A second desktop run forces the WebGL scene (`?escena=webgl`) and must also score **≥ 90**.
- **Unit tests** with a coverage threshold of **80%** for lines, statements, functions and branches, reported to Codecov.
- **End-to-end tests** with Playwright against the production build. They cover language routing, the per-route `<head>`, the scroll-driven scene, reduced motion, view transitions, keyboard focus in the gallery viewer, and the WebGL scene with its fallback to the SVG.
- **ESLint 10** with zero warnings: React 19 rules (`@eslint-react` and the hooks rules), accessibility (`jsx-a11y`) and import order. It runs on Node 22 and 24.

## Running it locally

You need Node `^22.13.0 || ^24.0.0 || >=26.0.0` and pnpm 10.

```bash
pnpm install
pnpm dev          # dev server at http://127.0.0.1:3000
```

| Script                          | What it does                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                      | Starts the Vite dev server                                                                                                    |
| `pnpm build`                    | Builds into `dist/`, then runs the post-build: validates the content and writes the build-time outputs listed above           |
| `pnpm preview`                  | Serves the production build                                                                                                   |
| `pnpm test` / `pnpm test:watch` | Runs the unit tests once or in watch mode                                                                                     |
| `pnpm coverage`                 | Runs the unit tests with coverage (HTML report in `coverage/`)                                                                |
| `pnpm test:e2e`                 | Runs the Playwright tests against the build (needs `pnpm build` and `pnpm exec playwright install chromium` first)            |
| `pnpm lint`                     | Runs ESLint                                                                                                                   |
| `pnpm format`                   | Formats the code with Prettier                                                                                                |
| `pnpm images`                   | Regenerates the WebP screenshots (640, 960 and 1280 px) from `images/projects/`                                               |
| `pnpm scene:avila <tile>`       | Regenerates El Ávila's profile from the SRTM tile `N10W067.hgt(.gz)`; see `scripts/avila-profile.ts` for where to download it |

## Project structure

```
src/
  main.tsx        Entry point
  app/
    components/   Layout and shared UI (header, hero, blocks, morph)
    config/       Canonical site URL
    features/     Home sections: impact, experience, projects, skills, contact
    pages/        Home and case study
    scene/        The Caracas scene: SVG parts, geometry, palette, camera journey; gl/ is the WebGL version
    theme/        Design tokens
  assets/         Self-hosted display font
  build/          The build-time outputs listed under "One content source, many outputs"
  content/        Typed bilingual content, its validation and image helpers
  lib/            i18n, locale paths, theme, motion, analytics, contrast
  __tests__/      Unit tests (Vitest)
  tailwind.css    Tailwind layers and base styles
  styles.css      A few extra global styles
scripts/          Post-build, image generation, El Ávila profile
e2e/              Playwright tests
docs/adr/         Architecture decision records (Spanish)
```
