import { glob } from "astro/loaders";
import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { Temporal } from "temporal-polyfill";

const markdown = (name: string) => glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: `./src/content/${name}` });
const text = z.string().trim().min(1);
const date = z.iso.date();
const datetime = z.union([z.date(), z.iso.datetime({ offset: true }).transform(value => new Date(value))]);
const publication = {
	publishedAt: datetime,
	updatedAt: datetime.optional(),
	draft: z.boolean().default(false)
};
const tags = z.array(text).default([]);

const authorSchema = z.object({
	name: z.string(),
	url: z.url().optional()
});

const defaultAuthors = [{ name: "Tanuj Ravi Rao", url: "https://tansanrao.com" }];

const writing = defineCollection({
	loader: markdown("writing"),
	schema: z.object({
		...publication,
		title: text,
		series: z.string().optional(), // Series name for grouped posts
		tags,
		description: z.string().optional(), // Post description/excerpt
		authors: z.array(authorSchema).default(defaultAuthors), // Visible byline authors
		canonicalURL: z.url().optional(), // Overrides self-canonical when syndicated
		syndicated: z.boolean().default(false), // Marks a cross-posted page as noindex
		sensitive: z.boolean().default(false), // Marks content as sensitive
		toc: z.boolean().default(false), // Whether to show table of contents
		top: z.number().int().nonnegative().default(0) // Top priority for sorting (higher is more important)
	})
});

const notes = defineCollection({
	loader: markdown("notes"),
	schema: z.object({
		...publication,
		title: text,
		tags,
		description: z.string().optional(), // Brief description
		sensitive: z.boolean().default(false), // Marks content as sensitive
		top: z.number().int().nonnegative().default(0) // Top priority for sorting (higher is more important)
	})
});

const projects = defineCollection({
	loader: markdown("projects"),
	schema: ({ image }) =>
		z
			.object({
				...publication,
				title: text,
				description: text,
				status: z.enum(["in-progress", "maintained", "completed", "archived"]),
				startedOn: date.optional(),
				endedOn: date.optional(),
				cover: z.object({ image: image(), alt: text }).optional(),
				links: z.array(z.object({ label: text, url: z.url() })).default([]),
				technologies: z.array(text).default([]),
				tags,
				relatedWriting: z.array(reference("writing")).default([])
			})
			.refine(value => !value.startedOn || !value.endedOn || value.endedOn >= value.startedOn, {
				message: "endedOn must not precede startedOn",
				path: ["endedOn"]
			})
});

const links = defineCollection({
	loader: markdown("links"),
	schema: z.object({
		title: text,
		url: z.url(),
		savedAt: datetime,
		kind: z.enum(["resource", "site"]),
		author: text.optional(),
		tags,
		draft: z.boolean().default(false)
	})
});

const books = defineCollection({
	loader: markdown("books"),
	schema: ({ image }) =>
		z.object({
			title: text,
			authors: z.array(text).min(1),
			status: z.enum(["to-read", "reading", "read", "paused", "abandoned"]),
			addedAt: datetime,
			cover: z.object({ image: image(), alt: text }).optional(),
			isbn: text.optional(),
			publicationYear: z.number().int().optional(),
			url: z.url().optional(),
			tags,
			readingSessions: z
				.array(
					z
						.object({
							startedOn: date.optional(),
							finishedOn: date.optional()
						})
						.refine(value => !value.startedOn || !value.finishedOn || value.finishedOn >= value.startedOn, {
							message: "finishedOn must not precede startedOn",
							path: ["finishedOn"]
						})
				)
				.default([]),
			draft: z.boolean().default(false)
		})
});

const photos = defineCollection({
	loader: markdown("photos"),
	schema: ({ image }) =>
		z
			.object({
				image: image(),
				alt: text,
				title: text.optional(),
				takenOn: date.optional(),
				takenAt: z.iso.datetime({ offset: true }).optional(),
				publishedAt: datetime,
				camera: reference("equipment").optional(),
				lens: reference("equipment").optional(),
				film: reference("equipment").optional(),
				settings: z
					.object({
						focalLengthMm: z.number().positive().optional(),
						aperture: z.number().positive().optional(),
						exposureSeconds: z.number().positive().optional(),
						iso: z.number().int().positive().optional(),
						exposureCompensationEv: z.number().optional()
					})
					.optional(),
				location: text.optional(),
				tags,
				draft: z.boolean().default(false)
			})
			.refine(value => !value.takenAt || (value.takenOn && value.takenOn === value.takenAt.slice(0, 10)), {
				message: "takenAt requires a matching local takenOn date",
				path: ["takenAt"]
			})
});

const photoCollections = defineCollection({
	loader: markdown("photoCollections"),
	schema: z
		.object({
			title: text,
			description: text.optional(),
			kind: z.enum(["album", "daily"]),
			cover: reference("photos").optional(),
			entries: z.array(z.object({ photo: reference("photos"), day: date.optional() })).default([]),
			challenge: z.object({ startsOn: date, days: z.number().int().positive() }).optional(),
			draft: z.boolean().default(false)
		})
		.superRefine((value, ctx) => {
			const issue = (message: string, path: (string | number)[]) => ctx.addIssue({ code: "custom", message, path });
			if (value.kind === "daily" && !value.challenge) issue("Daily collections require a challenge", ["challenge"]);
			if (value.kind === "album" && value.challenge) issue("Albums cannot define a challenge", ["challenge"]);
			const photos = new Set<string>();
			const days = new Set<string>();
			value.entries.forEach((entry, index) => {
				if (photos.has(entry.photo.id)) issue("A photo can only appear once in a collection", ["entries", index, "photo"]);
				photos.add(entry.photo.id);
				if (value.kind === "album" && entry.day) issue("Only daily collections assign days", ["entries", index, "day"]);
				if (value.kind !== "daily") return;
				if (!entry.day) {
					issue("Daily entries require a day", ["entries", index, "day"]);
					return;
				}
				if (days.has(entry.day)) issue("Only one photo is allowed per challenge day", ["entries", index, "day"]);
				days.add(entry.day);
				if (value.challenge && date.safeParse(value.challenge.startsOn).success && date.safeParse(entry.day).success) {
					const offset = Temporal.PlainDate.from(value.challenge.startsOn).until(Temporal.PlainDate.from(entry.day)).days;
					if (offset < 0 || offset >= value.challenge.days) issue("Day is outside the challenge window", ["entries", index, "day"]);
				}
			});
			if (value.cover && !photos.has(value.cover.id)) issue("Cover must belong to the collection", ["cover"]);
		})
});

const equipment = defineCollection({
	loader: glob({ pattern: ["**/*.yaml", "!**/_*.yaml"], base: "./src/content/equipment" }),
	schema: ({ image }) =>
		z.object({
			kind: z.enum(["camera", "lens", "film"]),
			name: text,
			manufacturer: text.optional(),
			image: z.object({ image: image(), alt: text }).optional(),
			url: z.url().optional()
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
	loader: glob({ pattern: "**/*.{md,yaml}", base: "./src/content/information" })
});

export const collections = { writing, notes, projects, links, books, photos, photoCollections, equipment, news, information };
