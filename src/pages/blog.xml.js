import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  
  return rss({
    title: 'Tanuj Ravi Rao - Blog',
    description: 'Blog posts from Tanuj Ravi Rao',
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom'
    },
    stylesheet: '/rss/styles.xsl',
    items: blog.map(post => ({
      link: `/blog/${post.slug}/`,
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      content: sanitizeHtml(parser.render(post.body))
    })),
    customData: `
      <atom:link href="${context.site}blog.xml" rel="self" type="application/rss+xml" />
      <atom:link href="${context.site}rss.xml" rel="alternate" type="application/rss+xml" title="Main RSS Feed" />
      <atom:link href="${context.site}notes.xml" rel="alternate" type="application/rss+xml" title="Notes RSS Feed" />
    `
  });
} 