---
title: Markdown Extension Manual
timestamp: 2025-11-24 00:00:00+00:00
tags: [Site-Docs]
description: Guide to the Markdown features supported by the site.
---

Astro uses [Sätteri](https://satteri.bruits.org/) to process Markdown and MDX. The site supports GitHub-Flavored Markdown, footnotes, heading attributes, syntax-highlighted code blocks, image captions, and GitHub-style alerts.

## Links

External links such as [the Astro documentation](https://docs.astro.build/) open in a new tab. Internal links, including this link to the [tables section](#tables), stay in the current tab.

## Code blocks

Fenced code blocks include syntax highlighting and a copy button.

```ts
const message = "Hello from Sätteri";
console.log(message);
```

## Tables

GitHub-Flavored Markdown tables support column alignment and are wrapped for horizontal scrolling on narrow screens.

| Left aligned | Centered | Right aligned |
| :----------- | :------: | ------------: |
| Alpha        |   Beta   |         Gamma |
| One          |   Two    |         Three |

## Footnotes

Standard GitHub-Flavored Markdown footnotes can contain formatting.[^footnote]

[^footnote]: Footnotes can contain **strong text**, links, and other standard Markdown.

## GitHub alerts

The site preserves GitHub's blockquote-based alert syntax.

```md
> [!NOTE]
> General information
```

> [!NOTE]
> General information

> [!TIP]
> Optional information

> [!IMPORTANT]
> Important information

> [!WARNING]
> Risk information

> [!CAUTION]
> Warning information

Custom titles follow the alert marker:

```md
> [!NOTE] Custom title
> Custom alert text
```

> [!NOTE] Custom title
> Custom alert text

## Heading attributes {#custom-heading-id}

Sätteri supports IDs, classes, and attributes on headings.

```md
## Heading attributes {#custom-heading-id}
```
