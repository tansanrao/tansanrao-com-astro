import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const authorSchema = z.object({
	name: z.string(),
	url: z.url().optional()
});

const defaultAuthors = [{ name: "Tanuj Ravi Rao", url: "https://tansanrao.com" }];

/**
 * Blog collection configuration
 * Represents main blog articles with comprehensive metadata
 */
const blog = defineCollection({
	// Load all markdown files except those starting with underscore (private/draft files)
	loader: glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(), // Post title (required)
		timestamp: z.date(), // Publication date (required)
		updatedTimestamp: z.date().optional(), // Last substantive update time
		series: z.string().optional(), // Series name for grouped posts
		tags: z.array(z.string()).optional(), // Array of topic tags
		description: z.string().optional(), // Post description/excerpt
		authors: z.array(authorSchema).default(defaultAuthors), // Visible byline authors
		canonicalURL: z.url().optional(), // Overrides self-canonical when syndicated
		syndicated: z.boolean().default(false), // Marks a cross-posted page as noindex
		sensitive: z.boolean().default(false), // Marks content as sensitive
		toc: z.boolean().default(false), // Whether to show table of contents
		top: z.number().int().nonnegative().default(0), // Top priority for sorting (higher is more important)
		draft: z.boolean().default(false) // Draft status (excludes from public listing)
	})
});

/**
 * Notes collection configuration
 * Represents shorter posts, quick thoughts, or micro-blog entries
 */
const notes = defineCollection({
	// Load all markdown files except those starting with underscore
	loader: glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: "./src/content/notes" }),
	schema: z.object({
		title: z.string(), // Note title (required)
		timestamp: z.date(), // Publication date (required)
		tags: z.array(z.string()).optional(), // Array of topic tags
		description: z.string().optional(), // Brief description
		sensitive: z.boolean().default(false), // Marks content as sensitive
		top: z.number().int().nonnegative().default(0), // Top priority for sorting (higher is more important)
		draft: z.boolean().default(false) // Draft status
	})
});

/**
 * News collection configuration
 * Represents timestamped personal updates and announcements
 */
const news = defineCollection({
	// Load all markdown files
	loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
	schema: z.object({
		timestamp: z.date() // Creation timestamp
	})
});

/**
 * Information collection configuration
 * Represents static content like about pages, policies, or site information
 */
const information = defineCollection({
	// Load both markdown and YAML files for mixed content types
	loader: glob({ pattern: "**/*.{md,mdx,yaml}", base: "./src/content/information" })
});

export const collections = { blog, notes, news, information };
