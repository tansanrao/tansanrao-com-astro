# AGENTS.md

Guidance for automated agents working in this repository.

## Commands (run from repo root)
- `npm run dev` - Start Astro dev server on port 4321 with host binding
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview the production build
- `npm run astro` - Run Astro CLI commands

## Project Overview
Personal website built with Astro v5.

### Content
- Collections defined in `src/content/config.ts`: `blog/`, `news/`, `garden/`, `resume/`
- Markdown content lives under `src/content/[collection]/`

### Dates
- Configuration in `src/config/site.ts` (timezone and locale)
- Use `@utils/datetime` helpers (`formatDate()`, `getCurrentYear()`, etc.); avoid native `Date` usage

### Routing
- Dynamic routes: `src/pages/[year].astro` and `src/pages/[year]/[month]/[slug].astro`
- RSS endpoints: `src/pages/blog.xml.js`, `garden.xml.js`, `rss.xml.js`
- Static pages: `src/pages/index.astro`, `cv.astro`

### UI and Styling
- Tailwind CSS v4 with `@tailwindcss/vite`
- Components grouped by feature: `src/components/blog/`, `home/`, `garden/`, `common/`
- Theme system: `ThemeSelector.astro`, `MobileThemeSelector.astro`

### Key Integrations
- `astro-icon`, `astro-seo`
- `@fontsource` typography packages
- `markdown-it`, `sanitize-html` for content processing

## Patterns
- Update Zod schemas in `src/content/config.ts` before adding new content fields
- Follow existing component naming and folder conventions
