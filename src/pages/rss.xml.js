import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { sortDatesByNewest, ensureTimezone } from '@utils/datetime';
const parser = new MarkdownIt();

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => !data.draft);
    const notes = await getCollection('notes', ({ data }) => !data.draft);

    // Combine all items with normalized structure for sorting
    const allItems = [
        ...blog.map((post) => ({
            ...post,
            type: 'blog'
        })),
        ...notes.map((note) => ({
            ...note,
            type: 'note'
        }))
    ];

    // Sort using the standardized datetime utility
    const sortedItems = sortDatesByNewest(allItems);

    return rss({
        title: 'Tanuj Ravi Rao',
        description: 'Personal website and blog',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items: sortedItems.map((item) => {
            const pubDate = ensureTimezone(item.data.pubDate);
            const year = pubDate.getFullYear();
            const month = (pubDate.getMonth() + 1).toString().padStart(2, '0');

            const renderedContent = sanitizeHtml(parser.render(item.body));

            let description;
            if (item.type === 'blog') {
                description = item.data.description;
            } else {
                // For notes, create a brief description from the content
                description =
                    renderedContent
                        .replace(/<[^>]*>/g, '') // Strip HTML tags
                        .substring(0, 150)
                        .trim() + (renderedContent.length > 150 ? '...' : '');
            }

            return {
                link:
                    item.type === 'blog'
                        ? `/blog/${year}/${month}/${item.slug}/`
                        : `/notes/${year}/${month}/${item.slug}/`,
                title: item.type === 'blog' ? item.data.title : '📝 ' + item.data.title,
                pubDate: item.data.pubDate,
                description: description,
                content: renderedContent
            };
        }),
        customData: `
      <atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml" />
      <atom:link href="${context.site}blog.xml" rel="alternate" type="application/rss+xml" title="Blog RSS Feed" />
      <atom:link href="${context.site}notes.xml" rel="alternate" type="application/rss+xml" title="Notes RSS Feed" />
    `
    });
}
