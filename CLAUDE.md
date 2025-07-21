# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands should be run from the project root:

- `npm run dev` - Start development server on localhost:4321 with host binding
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## Architecture Overview

This is a personal website built with Astro v5 using the following structure:

### Content Management
- **Collections**: Four main content types defined in `src/content/config.ts`:
  - `blog/` - Blog posts with Zod validation for metadata, tags, footnotes
  - `news/` - Brief news items/updates with publication dates
  - `notes/` - Longer-form notes similar to blog posts
  - `resume/` - JSON Resume format data for CV generation
- **Content Location**: All markdown content lives in `src/content/[collection]/`

### Date/Time System
The site uses a centralized date/time handling system:
- Configuration in `src/config/site.ts` (timezone: America/New_York, locale: en-US)
- Utilities in `src/utils/datetime.ts` for consistent formatting across components
- **Key principle**: Always use `formatDate()`, `getCurrentYear()`, etc. instead of native Date methods
- Supports timezone-aware formatting and date parsing

### Page Routing
- Dynamic routes: `[year].astro` and `[year]/[month]/[slug].astro` for dated content
- RSS feeds: Multiple XML endpoints (`blog.xml.js`, `notes.xml.js`, `rss.xml.js`)
- Static pages: homepage, CV page

### Styling & UI
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- Components organized by feature: `blog/`, `home/`, `notes/`, `common/`
- Theme system with `ThemeSelector.astro` and `MobileThemeSelector.astro`
- Responsive design with mobile-specific components

### Key Integrations
- **astro-icon** for iconography
- **astro-seo** for SEO meta tags
- **@fontsource** packages for typography (Cormorant Garamond, IBM Plex Sans/Mono)
- **markdown-it** and **sanitize-html** for content processing

## Important Patterns

### Content Schema
All content collections use strict Zod schemas. When adding new fields, update the schema in `src/content/config.ts` first.

### Date Handling
Always import and use utilities from `@utils/datetime` rather than working with Date objects directly. This ensures consistent timezone handling.

### Component Organization
Components are grouped by function (`blog/`, `notes/`, `home/`) with shared components in `common/`. Follow existing naming conventions.