import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { sortDatesByNewest, ensureTimezone } from '@utils/datetime';
const parser = new MarkdownIt();

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => !data.draft);

    return rss({
        title: 'Tanuj Ravi Rao - Blog',
        description: 'Expository musings on science, technology, and life.',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items: sortDatesByNewest(blog).map((post) => {
            const pubDate = ensureTimezone(post.data.pubDate);
            const year = pubDate.getFullYear();
            const month = (pubDate.getMonth() + 1).toString().padStart(2, '0');

            return {
                link: `/blog/${year}/${month}/${post.slug}/`,
                title: post.data.title,
                pubDate: post.data.pubDate,
                description: post.data.description,
                content: sanitizeHtml(parser.render(post.body))
            };
        }),
        customData: `
      <atom:link href="${context.site}blog.xml" rel="self" type="application/rss+xml" />
    `
    });
}
