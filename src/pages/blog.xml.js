import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import { sortDatesByNewest, ensureTimezone } from '@utils/datetime';

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => !data.draft);
    const items = await Promise.all(
        sortDatesByNewest(blog).map(async (post) => {
            const pubDate = ensureTimezone(post.data.pubDate);
            const year = pubDate.getFullYear();
            const month = (pubDate.getMonth() + 1).toString().padStart(2, '0');
            const renderedContent = post.rendered?.html ?? '';

            return {
                link: `/blog/${year}/${month}/${post.slug}/`,
                title: post.data.title,
                pubDate: post.data.pubDate,
                description: post.data.description,
                content: sanitizeHtml(renderedContent)
            };
        })
    );

    return rss({
        title: 'Tanuj Ravi Rao - Blog',
        description: 'Expository musings on science, technology, and life.',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items,
        customData: `
      <atom:link href="${context.site}blog.xml" rel="self" type="application/rss+xml" />
    `
    });
}
