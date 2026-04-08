#!/usr/bin/env tsx

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cancel, confirm, intro, isCancel, log, multiselect, note, outro, select, spinner, text } from "@clack/prompts";
import { Temporal } from "temporal-polyfill";

const CANCEL_MESSAGE = "Operation cancelled";

// Main function: Interactive CLI script for creating new articles
!(async () => {
	console.clear();
	intro("📝 Create New Article");

	// Determine the base content directory path
	let path = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content");

	// Select content type: Note, Jotting, or Preface
	const contentType = await select({
		message: "Select content type",
		options: [
			{ label: "Note", value: "note", hint: "In-depth, carefully conceived long-form works" },
			{ label: "Jotting", value: "jotting", hint: "Brief insights, scattered thoughts or daily observations" },
			{ label: "Preface", value: "preface", hint: "Life updates, site announcements or creative philosophy" }
		]
	});

	// Exit if user cancels the selection
	isCancel(contentType) && (cancel(CANCEL_MESSAGE), process.exit(0));

	// Update path based on selected content type
	path = join(path, contentType);

	// Generate timestamp in ISO format with timezone
	let content = "";
	const timestamp = Temporal.Now.zonedDateTimeISO().toString({ smallestUnit: "second", timeZoneName: "never" }).replace("T", " ");

	// Generate frontmatter metadata based on content type
	const information: any = {};
	if (contentType === "preface") {
		// Preface uses timestamp as filename
		information.timestamp = timestamp;

		content += "Start your content here...";
		// Generate filename from timestamp (e.g., 1970-01-01-00-00-00.md)
		path = join(path, `${timestamp.substring(0, 19).replace(/[\s:]/g, "-")}.md`);
	} else {
		// Note and Jotting require additional metadata
		content += "## Start Writing\n\nStart your content here...";

		// Prompt user to input article title
		const title = await text({
			message: "Article title",
			placeholder: "Enter title...",
			validate: value => (value ? undefined : "Title cannot be empty")
		});

		// Exit if user cancels the input
		isCancel(title) && (cancel(CANCEL_MESSAGE), process.exit(0));

		information.title = title;
		information.timestamp = timestamp;

		// Slugify function: Convert title to URL-friendly slug
		// Normalizes Unicode, removes special characters, converts to lowercase and hyphens
		const slugify = (text: string) =>
			text
				.toLowerCase()
				.normalize("NFKC")
				.replace(/[^\p{L}\p{N}\s-]+/gu, "")
				.trim()
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-+|-+$/g, "");

		// Prompt user to input content ID (filename)
		let id: string | symbol = slugify(title);
		id = await text({
			message: "Content ID (Filename)",
			placeholder: "Enter content ID...",
			initialValue: id,
			validate: value =>
				value && value === slugify(value)
					? undefined
					: "Content ID can only contain letters, numbers, hyphens, and cannot start or end with a hyphen"
		});

		// Exit if user cancels the input
		isCancel(id) && (cancel(CANCEL_MESSAGE), process.exit(0));

		// If content type is Note, allow user to specify a series
		if (contentType === "note") {
			// Prompt user to input series name (optional)
			const series = await text({
				message: "Series name (optional)",
				placeholder: "Leave empty if not part of a series"
			});

			// Exit if user cancels the input
			isCancel(series) && (cancel(CANCEL_MESSAGE), process.exit(0));

			// Add series to frontmatter if provided
			if (series) information.series = series;
		}

		// Prompt user to input tags (comma-separated)
		const tags = await text({
			message: "Tags (comma-separated, optional)",
			placeholder: "e.g.: Guide, Astro, Tutorial"
		});

		// Exit if user cancels the input
		isCancel(tags) && (cancel(CANCEL_MESSAGE), process.exit(0));

		// Add tags to frontmatter if provided
		if (tags) information.tags = `[${tags}]`;

		// Prompt user to input description (optional)
		const description = await text({
			message: "Description (optional)",
			placeholder: "Brief description of the content..."
		});

		// Exit if user cancels the input
		isCancel(description) && (cancel(CANCEL_MESSAGE), process.exit(0));

		// Add description to frontmatter if provided
		if (description) information.description = description;

		// Prompt user to select additional options (draft, toc, top, sensitive)
		const options = await multiselect({
			message: "Select additional options",
			options: [
				{ label: "Mark as draft", value: "draft" },
				...(contentType === "note" ? [{ label: "Show table of contents", value: "toc" }] : []),
				{ label: "Pin this content", value: "top" },
				{ label: "Mark as sensitive content", value: "sensitive" }
			],
			initialValues: ["draft"],
			required: false
		});

		// Exit if user cancels the selection
		isCancel(options) && (cancel(CANCEL_MESSAGE), process.exit(0));

		// Add selected options to frontmatter
		if (options.includes("sensitive")) information.sensitive = true;
		if (options.includes("toc")) information.toc = true;
		if (options.includes("top")) information.top = 1;
		if (options.includes("draft")) information.draft = true;

		// Prompt user to choose file structure: flat (single .md file) or folder (with index.md)
		const folder = await select({
			message: "Which file structure would you like to use?",
			options: [
				{ label: "Single markdown file", value: "flat", hint: `${id}.md` },
				{ label: "Folder with index file", value: "folder", hint: `${id}/index.md` }
			],
			initialValue: "flat"
		});

		// Exit if user cancels the selection
		isCancel(folder) && (cancel(CANCEL_MESSAGE), process.exit(0));

		// Set file path based on selected structure
		if (folder === "folder") {
			path = join(path, id, "index.md");
		} else {
			path = join(path, `${id}.md`);
		}
	}

	// Construct frontmatter with metadata and content template
	content = `---
${Object.entries(information)
	.map(([key, value]) => `${key}: ${value}`)
	.join("\n")}
---

${content}
`;

	// Display the generated content to the user for review
	`${note(content, `Here is the content that will be created at ${path}`)}:`;

	// Confirm with user to proceed with file creation
	const proceed = await confirm({
		message: "Do you want to proceed with creating this file?",
		initialValue: true
	});

	// Exit if user cancels or chooses not to proceed
	(isCancel(proceed) || !proceed) && (cancel(CANCEL_MESSAGE), process.exit(0));

	// Check if file already exists and prompt for confirmation to overwrite
	if (existsSync(path)) {
		const overwrite = await confirm({
			message: `File ${path} already exists. Overwrite?`
		});

		// Exit if user cancels or chooses not to overwrite
		(isCancel(overwrite) || !overwrite) && (cancel(CANCEL_MESSAGE), process.exit(0));
	}

	// Create parent directories if they don't exist
	mkdirSync(dirname(path), { recursive: true });

	// Write the file to disk
	const waiting = spinner();
	waiting.start("Creating file...");

	writeFileSync(path, content, "utf-8");
	waiting.stop("✅ File created successfully!");

	// Ask if user wants to open the file in VS Code
	const openInVSCode = await confirm({
		message: "🖥️ Do you want to open this file in VS Code?",
		initialValue: true
	});

	// Open file in VS Code if confirmed
	if (!isCancel(openInVSCode) && openInVSCode) {
		const { exec } = await import("node:child_process");
		exec(`code "${path}"`, error => error && log.error(`Failed to open VS Code: ${error.message}`));
	}

	outro("🎉 Done! Happy writing!");
})().catch(error => {
	// Handle any errors that occur during execution
	log.error("An error occurred:");
	log.error(error);
	process.exit(1);
});
