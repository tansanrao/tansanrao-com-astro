import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { sortDatesByNewest, ensureTimezone } from '@utils/datetime';
const parser = new MarkdownIt();

export async function GET(context) {
    const notes = await getCollection('notes', ({ data }) => !data.draft);

    return rss({
        title: 'Tanuj Ravi Rao - Notes',
        description: 'Short-form thoughts, updates, and observations.',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items: sortDatesByNewest(notes).map((note) => {
            const pubDate = ensureTimezone(note.data.pubDate);
            const year = pubDate.getFullYear();
            const month = (pubDate.getMonth() + 1).toString().padStart(2, '0');

            const renderedContent = sanitizeHtml(parser.render(note.body));
            // Create a brief description from the content (first sentence or ~150 chars)
            const description =
                renderedContent
                    .replace(/<[^>]*>/g, '') // Strip HTML tags
                    .substring(0, 150)
                    .trim() + (renderedContent.length > 150 ? '...' : '');

            return {
                link: `/notes/${year}/${month}/${note.slug}/`,
                title: '📝 ' + note.data.title,
                pubDate: note.data.pubDate,
                description: description,
                content: renderedContent
            };
        }),
        customData: `
      <atom:link href="${context.site}notes.xml" rel="self" type="application/rss+xml" />
    `
    });
}
