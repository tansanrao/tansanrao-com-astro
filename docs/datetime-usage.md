# Date and Time Handling Documentation

This document describes the standardized date and time handling system implemented across the website.

## Overview

The website now uses a centralized date/time configuration system that ensures consistent formatting and timezone handling across all components. This system eliminates hardcoded locale strings and provides proper timezone support for dates without explicit timezone information.

## Configuration

### Site Configuration (`src/config/site.ts`)

The main configuration is stored in `SITE_CONFIG`:

```typescript
export const SITE_CONFIG = {
  timezone: 'America/New_York', // Change this to your preferred timezone
  locale: 'en-US', // Change this to your preferred locale
  // ... other config
};
```

To change the site's timezone or locale, update these values in the configuration file.

### Available Timezones

Common timezone values:
- `'America/New_York'` - Eastern Time
- `'America/Chicago'` - Central Time
- `'America/Denver'` - Mountain Time
- `'America/Los_Angeles'` - Pacific Time
- `'Europe/London'` - British Time
- `'Europe/Paris'` - Central European Time
- `'Asia/Tokyo'` - Japan Standard Time
- `'UTC'` - Coordinated Universal Time

### Available Locales

Common locale values:
- `'en-US'` - English (United States)
- `'en-GB'` - English (United Kingdom)
- `'fr-FR'` - French (France)
- `'de-DE'` - German (Germany)
- `'es-ES'` - Spanish (Spain)
- `'ja-JP'` - Japanese (Japan)

## Date Utility Functions (`src/utils/datetime.ts`)

### Basic Formatting Functions

#### `formatDate(date, format?, options?)`

Formats a date using predefined format styles:

```typescript
import { formatDate } from '@utils/datetime';

// Available formats: 'full', 'short', 'compact', 'year', 'monthDay'
formatDate(new Date(), 'short'); // "Jan 10, 2025"
formatDate(new Date(), 'full');  // "January 10, 2025"
formatDate(new Date(), 'compact'); // "01/10/2025"
```

#### `formatDateTime(date, options?)`

Formats a date with time information:

```typescript
import { formatDateTime } from '@utils/datetime';

formatDateTime(new Date()); // "January 10, 2025 at 3:30 PM EST"
formatDateTime(new Date(), { includeTimezone: false }); // "January 10, 2025 at 3:30 PM"
```

### Utility Functions

#### `getCurrentYear()`

Gets the current year in the configured timezone:

```typescript
import { getCurrentYear } from '@utils/datetime';

const year = getCurrentYear(); // 2025
```

#### `getBuildDate(format?)`

Gets the current date formatted for build timestamps:

```typescript
import { getBuildDate } from '@utils/datetime';

const buildDate = getBuildDate('short'); // "Jan 10, 2025"
```

### Collection Helpers

#### `sortDatesByNewest(items)` / `sortDatesByOldest(items)`

Sort collections by publication date:

```typescript
import { sortDatesByNewest, sortDatesByOldest } from '@utils/datetime';

const sortedNews = sortDatesByNewest(newsItems);
const chronological = sortDatesByOldest(blogPosts);
```

#### `extractYears(items, sort?)`

Extract unique years from a collection:

```typescript
import { extractYears } from '@utils/datetime';

const years = extractYears(blogPosts, 'desc'); // ['2025', '2024', '2023']
```

#### `isDateInYear(date, year)`

Check if a date belongs to a specific year:

```typescript
import { isDateInYear } from '@utils/datetime';

const isFrom2025 = isDateInYear(post.data.pubDate, '2025');
```

### Advanced Functions

#### `getRelativeTime(date)`

Get human-readable relative time:

```typescript
import { getRelativeTime } from '@utils/datetime';

getRelativeTime(yesterday); // "1 day ago"
getRelativeTime(lastWeek);  // "1 week ago"
```

#### `ensureTimezone(date)`

Ensures dates without timezone info use the configured timezone:

```typescript
import { ensureTimezone } from '@utils/datetime';

// Dates from content files (YYYY-MM-DD) will be interpreted in the configured timezone
const localDate = ensureTimezone('2025-01-10');
```

## Usage in Components

### Basic Date Display

```astro
---
import { formatDate } from '@utils/datetime';

const post = await getEntry('blog', 'my-post');
---

<time>{formatDate(post.data.pubDate, 'short')}</time>
```

### News/Blog Listings

```astro
---
import { sortDatesByNewest, formatDate } from '@utils/datetime';

const allPosts = await getCollection('blog');
const sortedPosts = sortDatesByNewest(allPosts);
---

{sortedPosts.map(post => (
  <article>
    <time>{formatDate(post.data.pubDate, 'short')}</time>
    <h2>{post.data.title}</h2>
  </article>
))}
```

### Year-based Filtering

```astro
---
import { extractYears, isDateInYear } from '@utils/datetime';

const allPosts = await getCollection('blog');
const years = extractYears(allPosts);
const { year } = Astro.params;

const filteredPosts = year 
  ? allPosts.filter(post => isDateInYear(post.data.pubDate, year))
  : allPosts;
---
```

## Content Schema

The system works with Astro's content collections that define dates using `z.date()`:

```typescript
// src/content/config.ts
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    // ...
  })
});
```

## Timezone Handling

### For Content Authors

When writing content with dates in frontmatter, use the standard YAML date format:

```yaml
---
pubDate: 2025-01-10
updatedDate: 2025-01-15
---
```

These dates will be automatically interpreted in the configured timezone.

### For Developers

- All date formatting functions respect the configured timezone
- Dates without explicit timezone information are assumed to be in the configured timezone
- Use the utility functions instead of direct `Date` methods for consistency

## Migration from Old System

The old hardcoded date formatting:

```javascript
// OLD - Don't do this
date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});
```

Should be replaced with:

```javascript
// NEW - Use this
import { formatDate } from '@utils/datetime';
formatDate(date, 'short');
```

## Customization

### Adding New Date Formats

To add a new date format, update the `formats` object in `src/utils/datetime.ts`:

```typescript
export const DATE_CONFIG = {
  // ...
  formats: {
    // ... existing formats
    custom: {
      weekday: 'long' as const,
      year: 'numeric' as const,
      month: 'long' as const,
      day: 'numeric' as const,
    },
  }
} as const;
```

### Overriding Timezone/Locale

You can override the default timezone or locale for specific use cases:

```typescript
formatDate(date, 'short', { 
  timezone: 'UTC', 
  locale: 'en-GB' 
});
```

## Best Practices

1. **Always use the utility functions** instead of direct `Date` methods
2. **Update the site configuration** rather than hardcoding timezone/locale values
3. **Use semantic format names** (`'short'`, `'full'`) rather than format objects
4. **Test timezone changes** by updating the configuration and verifying all dates display correctly
5. **Be consistent** - use the same format for similar content types across the site

## Troubleshooting

### Dates showing in wrong timezone

- Check that `SITE_CONFIG.timezone` is set correctly
- Verify you're using the utility functions instead of native Date methods

### Inconsistent date formatting

- Ensure all components import and use the utility functions
- Check that hardcoded `toLocaleDateString` calls have been replaced

### Build errors after changes

- Verify TypeScript path mappings are correct in `tsconfig.json`
- Check that imports use the correct paths (`@utils/datetime`, `@config/site`)