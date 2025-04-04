import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  
  return rss({
    title: 'Tanuj Ravi Rao - Notes',
    description: 'Digital garden notes from Tanuj Ravi Rao',
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom'
    },
    stylesheet: '/rss/styles.xsl',
    items: notes.map(note => ({
      link: `/notes/${note.slug}/`,
      title: "📝 " + note.data.pubDate.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                }) + " — " + note.data.title,
      pubDate: note.data.pubDate,
      description: "",
      content: sanitizeHtml(parser.render(note.body))
    })),
    customData: `
      <atom:link href="${context.site}notes.xml" rel="self" type="application/rss+xml" />
      <atom:link href="${context.site}rss.xml" rel="alternate" type="application/rss+xml" title="Main RSS Feed" />
      <atom:link href="${context.site}blog.xml" rel="alternate" type="application/rss+xml" title="Blog RSS Feed" />
    `
  });
} 
