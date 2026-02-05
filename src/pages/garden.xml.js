import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import { getGardenNoteUrl, slugifyTopic, sortGardenEntries } from '@utils/garden';

export async function GET(context) {
    const notes = await getCollection('garden', ({ data }) => !data.draft);
    const items = await Promise.all(
        sortGardenEntries(notes, 'newest').map(async (note) => {
            const renderedContent = note.rendered?.html ?? '';
            const topicSlug = slugifyTopic(note.data.topics[0]);

            return {
                link: `${getGardenNoteUrl(topicSlug, note.slug)}/`,
                title: '🌿 ' + note.data.title,
                pubDate: note.data.pubDate,
                description: note.data.description,
                content: sanitizeHtml(renderedContent)
            };
        })
    );

    return rss({
        title: 'Tanuj Ravi Rao - Garden',
        description: 'Digital garden notes and shorter content pieces.',
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom'
        },
        stylesheet: '/rss/styles.xsl',
        items,
        customData: `
      <atom:link href="${context.site}garden.xml" rel="self" type="application/rss+xml" />
    `
    });
}
