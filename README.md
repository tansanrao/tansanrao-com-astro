# tansanrao-com-astro

This repository contains the source and theme for my personal website, [tansanrao.com](https://tansanrao.com/).

## Attribution

This site is based on [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite), an Astro theme created by [tuyuritio](https://github.com/tuyuritio). This repository is a derived work adapted for my personal site and is not the upstream ThoughtLite project.

## Local Development

```sh
pnpm install
pnpm dev
```

To create a production build:

```sh
pnpm build
```

## Presentation and browser behavior

The site renders static HTML with Astro and Tailwind. Pages select content and
compose components; they do not own reusable presentation or browser controllers.

- `src/styles/tokens.css` is the source for colors, typography, and reading dimensions.
  `global.css` contains shared utilities; `markdown.css` styles article content.
- `Base.astro` assembles the site shell. `ReadingLayout.astro` owns reading geometry
  through header, default-content, and controls slots, independently of article styling.
- `ArticleHeader`, `EntryMeta`, `NewsList`, `Icon`, and `Prose` share presentation.
  Linkroll data lives in `src/data/linkroll.ts` and content remains Markdown/YAML.
- `Archive.astro` renders all summaries, then enhances them with tag intersection,
  optional series selection, and pagination. URLs retain repeated `tag`, `series`
  (blog only), and `page` parameters; changes replace the current history entry.
  Without JavaScript the full archive is readable, without filter/pagination controls.
- Scripts live in their owning Astro components: prose copy/zoom, reading progress,
  TOC highlighting, heatmap, theme, and the native content-warning disclosure.
  `src/lib/drawers.ts` is shared by the header and TOC for focus, Escape, overlays,
  and responsive state. Navigation uses ordinary page loads. Hidden prose remains
  in the DOM, so it needs no separate rendering or global reinitialization hook.

Before changing presentation, run `pnpm check`, `pnpm lint`, `pnpm test`, and
`pnpm build`; inspect desktop/narrow and light/dark layouts in the browser. For
interaction changes, also check keyboard navigation and JavaScript-disabled pages.

## Amp Orbs

`.agents/setup` installs the Node version in `.nvmrc`, the pnpm version in
`package.json`, and dependencies from the frozen lockfile. Amp snapshots the prepared
environment for reuse; rerunning setup reuses installed tools and dependencies.
The pinned tools are available in repository-scoped login shells, including
supervised services. No application secrets, database, or resume hook are required.

Start the supervised Astro dev server and obtain its portal link with:

```sh
amp orb services ensure
```

## License

This repository remains licensed under [GPLv3](./LICENSE). ThoughtLite, the base theme this work is derived from, is also distributed under GPLv3.
