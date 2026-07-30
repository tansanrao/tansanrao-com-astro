import { describe, expect, it } from "vitest";
import { markdownToHtml } from "satteri";
import { markdownHastPlugins, markdownMdastPlugins } from "./plugins";

function renderMarkdown(source: string) {
	return markdownToHtml(source, {
		mdastPlugins: markdownMdastPlugins,
		hastPlugins: markdownHastPlugins,
		features: {
			gfm: true,
			frontmatter: true,
			headingAttributes: true,
			math: false,
			smartPunctuation: false
		}
	}).html;
}

describe("Sätteri Markdown plugins", () => {
	it("renders GitHub alerts with default and custom titles", () => {
		const html = renderMarkdown(`
> [!WARNING]
> Default title with **markup**

> [!NOTE] Release update
> Custom title text
`);

		expect(html).toContain('<div class="markdown-alert markdown-alert-warning">');
		expect(html).toContain('<p class="markdown-alert-title"><svg');
		expect(html).toContain("<strong>Warning</strong>");
		expect(html).toContain("Default title with <strong>markup</strong>");
		expect(html).toContain('<div class="markdown-alert markdown-alert-note">');
		expect(html).toContain("<strong>Release update</strong>");
		expect(html).toContain("<p>Custom title text</p>");
	});

	it("adds stable heading IDs, self-links, and nested sections", () => {
		const html = renderMarkdown(`
## Introduction

Text.

### Details

More text.

## Named heading {#custom-id}
`);

		expect(html).toContain('<section class="heading" data-heading-rank="2" aria-labelledby="introduction">');
		expect(html).toContain('<h2 id="introduction"><a href="#introduction">Introduction</a></h2>');
		expect(html).toContain('<section class="heading" data-heading-rank="3" aria-labelledby="details">');
		expect(html).toContain('<h2 id="custom-id"><a href="#custom-id">Named heading</a></h2>');
		expect(renderMarkdown("## Introduction")).toContain('id="introduction"');
	});

	it("preserves the accessible footnote label without adding it to heading links", () => {
		const html = renderMarkdown(`
Text with a footnote.[^one]

[^one]: Footnote body.
`);

		expect(html).toContain('<section data-footnotes class="footnotes"><p class="hidden" id="footnote-label">Footnotes</p>');
		expect(html).not.toContain('href="#footnote-label"');
		expect(html).toContain("data-footnote-ref");
		expect(html).toContain("data-footnote-backref");
	});

	it("transforms links, figures, tables, and code blocks", () => {
		const html = renderMarkdown(`
[External](https://example.com)

![Caption](https://example.com/image.png)

| A | B |
| - | - |
| 1 | 2 |

\`\`\`ts
const value = 1;
\`\`\`
`);

		expect(html).toContain('<a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">External</a>');
		expect(html).toContain('<figure><img src="https://example.com/image.png" alt="Caption"><figcaption>Caption</figcaption></figure>');
		expect(html).toContain('<div class="table-wrapper"><table>');
		expect(html).toContain('<div class="code-container"><pre>');
		expect(html).toContain('class="code-copy-button"');
		expect(html).toContain('aria-label="Copy code"');
	});
});
