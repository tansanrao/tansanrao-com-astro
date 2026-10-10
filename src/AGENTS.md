# Design system

`styles/tokens.css` owns the site's design values. The homepage, shared header,
and footer are migrated; other pages are pending review. Do not migrate those
pages merely to make them match while working on the homepage.

- Use complete `--type-*` roles through `font: var(--type-...)`. Do not set local
  font sizes, weights, line heights, letter spacing, or font families, including
  arbitrary Tailwind typography classes. Display and lead are editorial roles;
  body is prose; label is navigation/actions; meta is dates/statuses; caption is
  supplementary information. Keep heading semantics independent of visual roles.
- Use `--space-*` or relationship tokens (`--section-gap`, `--grid-gap`,
  `--card-padding`, `--row-padding`) for nonzero padding, margin, and gaps.
- Use shared shell, control, icon, border, and radius tokens. Use `.icon-control`
  for standalone icon actions. Keep visible icon size separate from hit area.
- Use shared responsive variants (`sm`, `md`, `lg`), with `@reference` to
  `styles/global.css` in Astro stylesheets. Nest `@variant` inside the selector so
  Astro preserves its scoped specificity. The navigation disclosure's `sm`
  threshold must agree with `layouts/header/Header.astro`; article drawer
  thresholds must agree with `lib/drawers.ts`.
- Local CSS may arrange content with flex/grid, fractions, percentages, zero,
  intrinsic sizes, and image aspect ratios. SVG drawing coordinates and image
  source dimensions are not layout spacing. Do not create a page-specific token
  to disguise a one-off; revise a shared role if an existing role is insufficient.
- Let text wrap and containers grow. Do not shrink reading text or metadata on
  narrow screens. Check both themes, breakpoint boundaries, 320px reflow, enlarged
  text, and keyboard navigation when changing migrated surfaces.
