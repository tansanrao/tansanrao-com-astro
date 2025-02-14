import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  const notes = await getCollection('notes', ({ data }) => !data.draft);

  // Combine and sort all items by date
  const allItems = [
    ...blog.map(post => ({
      ...post,
      type: 'blog',
      pubDate: post.data.pubDate
    })),
    ...notes.map(note => ({
      ...note,
      type: 'note',
      pubDate: note.data.pubDate
    }))
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Tanuj Ravi Rao',
    description: 'Personal website and blog',
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom'
    },
    stylesheet: '/rss/styles.xsl',
    items: allItems.map(item => ({
      link: item.type === 'blog' 
        ? `/blog/${item.slug}/`
        : `/notes/${item.slug}/`,
      title: item.type === 'blog' ? item.data.title : item.slug,
      pubDate: item.pubDate,
      description: item.type === 'blog' 
        ? item.data.description 
        : sanitizeHtml(parser.render(item.body)),
      content: sanitizeHtml(parser.render(item.body))
    })),
    customData: `
      <atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml" />
      <atom:link href="${context.site}blog.xml" rel="alternate" type="application/rss+xml" title="Blog RSS Feed" />
      <atom:link href="${context.site}notes.xml" rel="alternate" type="application/rss+xml" title="Notes RSS Feed" />
    `
  });
} 