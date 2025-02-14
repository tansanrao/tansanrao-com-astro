# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📅 Date and Time Handling

This website uses a standardized date and time handling system to ensure consistent formatting and proper timezone support across all components.

### Configuration

The timezone and locale can be configured in `src/config/site.ts`:

```typescript
export const SITE_CONFIG = {
  timezone: 'America/New_York', // Change to your preferred timezone
  locale: 'en-US', // Change to your preferred locale
  // ...
};
```

### Usage

Instead of using native Date methods directly, use the utility functions from `src/utils/datetime.ts`:

```typescript
import { formatDate, getCurrentYear, sortDatesByNewest } from '@utils/datetime';

// Format dates consistently
const formattedDate = formatDate(post.data.pubDate, 'short'); // "Jan 10, 2025"

// Get current year in configured timezone
const year = getCurrentYear(); // 2025

// Sort collections by date
const sortedPosts = sortDatesByNewest(blogPosts);
```

### Key Features

- **Centralized timezone configuration** - Change once, apply everywhere
- **Consistent date formatting** - Predefined format styles across the site
- **Proper timezone handling** - Dates without timezones use the configured timezone
- **Collection helpers** - Sort and filter dated content easily

For detailed documentation, see `docs/datetime-usage.md`.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
