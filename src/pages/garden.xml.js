import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { getGardenNoteUrl, slugifyTopic, sortGardenEntries } from '@utils/garden';
const parser = new MarkdownIt();

export async function GET(context) {
    const notes = await getCollection('garden', ({ data }) => !data.draft);

    return rss({
        title: 'Tanuj Ravi Rao - Garden',
        description: 'Digital garden notes and shorter content pieces.',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items: sortGardenEntries(notes, 'newest').map((note) => {
            const markdownBody = typeof note.body === 'string' ? note.body : '';
            const renderedContent = sanitizeHtml(parser.render(markdownBody));
            const topicSlug = slugifyTopic(note.data.topics[0]);

            return {
                link: `${getGardenNoteUrl(topicSlug, note.slug)}/`,
                title: '🌿 ' + note.data.title,
                pubDate: note.data.pubDate,
                description: note.data.description,
                content: renderedContent
            };
        }),
        customData: `
      <atom:link href="${context.site}garden.xml" rel="self" type="application/rss+xml" />
    `
    });
}
