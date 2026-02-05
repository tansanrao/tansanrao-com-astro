import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import { sortDatesByNewest, ensureTimezone } from '@utils/datetime';
import { getGardenNoteUrl, slugifyTopic } from '@utils/garden';

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => !data.draft);
    const garden = await getCollection('garden', ({ data }) => !data.draft);

    // Combine all items with normalized structure for sorting
    const allItems = [
        ...blog.map((post) => ({
            ...post,
            type: 'blog'
        })),
        ...garden.map((note) => ({
            ...note,
            type: 'garden'
        }))
    ];

    // Sort using the standardized datetime utility
    const sortedItems = sortDatesByNewest(allItems);

    const items = await Promise.all(
        sortedItems.map(async (item) => {
            const pubDate = ensureTimezone(item.data.pubDate);
            const year = pubDate.getFullYear();
            const month = (pubDate.getMonth() + 1).toString().padStart(2, '0');
            const renderedContent = item.rendered?.html ?? '';

            return {
                link:
                    item.type === 'blog'
                        ? `/blog/${year}/${month}/${item.slug}/`
                        : `${getGardenNoteUrl(slugifyTopic(item.data.topics[0]), item.slug)}/`,
                title: item.type === 'blog' ? item.data.title : '🌿 ' + item.data.title,
                pubDate: item.data.pubDate,
                description: item.data.description,
                content: sanitizeHtml(renderedContent)
            };
        })
    );

    return rss({
        title: 'Tanuj Ravi Rao',
        description: 'Personal website and blog',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items,
        customData: `
      <atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml" />
      <atom:link href="${context.site}blog.xml" rel="alternate" type="application/rss+xml" title="Blog RSS Feed" />
      <atom:link href="${context.site}garden.xml" rel="alternate" type="application/rss+xml" title="Garden RSS Feed" />
    `
    });
}
