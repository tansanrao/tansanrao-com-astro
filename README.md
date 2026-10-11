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

## Content and routes

Schemas live in `src/content.config.ts`. Use Markdown with YAML frontmatter in
`src/content/<collection>/<id>.md` (or `<id>/index.md` with colocated images).
IDs are stable filenames, not regenerated from titles. `draft: true` excludes an
entry from pages, indexes, and feeds. Underscore-prefixed Markdown is not loaded.
All calendar-only dates must be quoted `"YYYY-MM-DD"` strings; timestamps include
an offset, e.g. `2026-10-10T12:00:00-04:00`.

| Collection | Route | Required metadata beyond the body |
| --- | --- | --- |
| `writing` | `/writing/YYYY/MM/{id}` | `title`, `publishedAt` |
| `projects` | `/building/{id}` | `title`, `description`, `status`, `publishedAt` |
| `notes` | `/garden/notes/{id}` | `title`, `publishedAt` |
| `links` | `/garden/links#{id}` | `title`, `url`, `savedAt`, `kind` (`resource` or `site`) |
| `books` | `/garden/books/{id}` | `title`, `authors` array, `status`, `addedAt` |
| `photos` | `/photography/photos/{id}` | `image`, `alt`, `publishedAt` |
| `photoCollections` | `/photography/collections/{id}`; `365` uses `/photography/365` | `title`, `kind` (`album` or `daily`); daily collections also require `challenge` |
| `equipment` | Metadata referenced by photos | YAML files with `name`, `kind` (`camera`, `lens`, or `film`) |

`pnpm new` creates Writing, Notes, or News entries. New collections can be authored
directly using these schemas. Writing preserves authors, tags, series, TOC,
content warnings, pin priority, canonical URLs, and syndication. `publishedAt`
replaces `timestamp`, and `updatedAt` replaces `updatedTimestamp`; News retains
its existing `timestamp`. Year/month routes use UTC, as the old blog did.

Projects accept `in-progress`, `maintained`, `completed`, or `archived`; optional
fields include `startedOn`, `endedOn`, `cover: { image, alt }`, `links: [{ label,
url }]`, `technologies`, `tags`, and `relatedWriting` (Writing IDs). Books accept
`to-read`, `reading`, `read`, `paused`, or `abandoned`; optional metadata includes
`cover: { image, alt }`, `isbn`, `publicationYear`, `pages`, `rating`, `url`, `tags`, and
`readingSessions: [{ startedOn, finishedOn }]`. Their bodies hold project
descriptions and reading notes respectively. Links use their body for annotations;
the former linkroll is imported as `site` entries (their `savedAt` is the migration
date, not a claim about when the sites were first discovered).

### Garden authoring

The Garden overview shows recently edited notes, saved links, and current reading
(or recently added books when nothing is in progress). Notes use `description` for
their card summary and `updatedAt` for meaningful revisions; neither is required.
Tags filter Notes and Links through repeated `?tag=` values (all selected tags must
match). Links also support `?kind=resource` or `?kind=site`; Notes support
`?sort=published` or `?sort=oldest`. The default is recently updated, with pinned
notes first. Without JavaScript, all entries remain readable.

Example `src/content/books/example.md` (replace the sample metadata):

```yaml
---
title: Example book
authors: [Example author]
status: read
addedAt: 2026-10-10T12:00:00Z
pages: 224
rating: 4.5
tags: [design]
readingSessions:
  - startedOn: "2026-09-01"
    finishedOn: "2026-10-03"
draft: true
---
My reflections on this book.
```

`pages` is a positive integer; `rating` is your current overall assessment from
0–5, in half-point increments. Omit unknown values. Shelf years come from each
session's `finishedOn`, never `addedAt`; rereads appear in each completion year.
Finished books without a known completion date get an undated shelf. An unfinished
session may contain only `startedOn`. Shelf selection and the List alternative work
without JavaScript. Covers are optional; a neutral title/author cover is the fallback.

Example `src/content/links/example/index.md`:

```yaml
---
title: A useful reference
url: https://example.com/article
savedAt: 2026-10-10T12:00:00Z
kind: resource
tags: [design]
draft: true
---
Why I saved this, and what I want to return to.
```

Optionally add `preview: { image: ./preview.jpg, alt: "Description of the preview" }`
with a colocated image. Previews use an explicit disclosure, not a hover-only popup.
No external metadata service or publishing integration is required.

### Photography authoring

A photo's body is its caption/story; `alt` separately describes its visual content.
`takenOn` is the local calendar date, independent of publication time. Omit it when
unknown (e.g. a film scan); do not substitute the scan date. Optional `takenAt`
must include a timezone offset and match `takenOn`. Equipment references use the
YAML file ID and are checked for existence and correct kind during a build.

Example `src/content/photos/evening/index.md` (replace the image and metadata):

```yaml
---
image: ./photo.jpg
alt: Golden light falling across a brick wall
publishedAt: 2026-10-10T20:00:00-04:00
takenOn: "2026-10-10"
takenAt: "2026-10-10T18:15:00-04:00"
camera: my-camera
settings:
  focalLengthMm: 35
  aperture: 2
  exposureSeconds: 0.004
  iso: 400
  exposureCompensationEv: 0
draft: true
---
An optional caption goes here.
```

Example `src/content/equipment/my-camera.yaml`:

```yaml
kind: camera
name: My camera
```

Create `src/content/photoCollections/365.md` when the start date is known:

```yaml
---
title: 365 — one photo a day
kind: daily
challenge:
  startsOn: "2026-10-10"
  days: 365
entries:
  - photo: evening
    day: "2026-10-10"
cover: evening
draft: true
---
An optional collection introduction goes here.
```

Daily dates must be unique and inside the challenge window; gaps are allowed.
Day numbers and progress are derived, so late publication does not renumber days.
Albums use `kind: album`, omit `challenge` and entry `day`, and retain the order
of `entries`. A photo can belong to multiple collections but only once in each.
Covers must belong to their collection. Public collections cannot reference draft
photos. Publish the photos before publishing their collection.

Optional photo metadata: `title`, `lens`, `film`, `location` (a public place name),
and `tags`. Dates/EXIF are currently entered in frontmatter; there is no automatic
EXIF importer. Gallery/detail images are re-encoded as WebP; no original-download
link or public GPS field is exposed. Calendar/equipment browsing and a separate
photography feed are not part of this structural pass.

### Migration

`public/_redirects` freezes the old blog URLs and graph-image URLs as Cloudflare
Pages 301 redirects. Astro reads the same map for local redirects and static HTML
fallbacks; other static hosts need equivalent HTTP redirect rules. Do not rebuild
legacy aliases from edited article dates. Old Notes/Garden aliases are removed.
`/cv` redirects to `/about`; existing résumé anchors remain available. About reads
the introduction Markdown and `src/data/resume.json`. `/feed.xml` remains the
Writing/Notes Atom feed with existing item IDs. Home retains News and recent
writing while the visual redesign is pending.

## Presentation and browser behavior

The site renders static HTML with Astro and Tailwind. Pages select content and
compose components; they do not own reusable presentation or browser controllers.

- `src/styles/tokens.css` is the source for colors, typography, and reading dimensions.
  `global.css` contains shared utilities; `markdown.css` styles article content.
- `Base.astro` assembles the site shell. `ReadingLayout.astro` owns reading geometry
  through header, default-content, and controls slots, independently of article styling.
- `ArticleHeader`, `EntryMeta`, `NewsList`, `Icon`, and `Prose` share presentation.
  Garden Links are content entries; content remains Markdown/YAML.
- `Archive.astro` renders all summaries, then enhances them with tag intersection,
  optional series selection, and pagination. URLs retain repeated `tag`, `series`
  (Writing only), and `page` parameters; changes replace the current history entry.
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
