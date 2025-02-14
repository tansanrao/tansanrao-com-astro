/**
 * Centralized site configuration
 * Update these values to change timezone and locale settings across the entire site
 */

export const SITE_CONFIG = {
  // Site metadata
  title: 'Tanuj Ravi Rao',
  description: 'Personal website of Tanuj Ravi Rao',
  url: 'https://tansanrao.com',

  // Date and time settings
  timezone: 'America/New_York', // Change this to your preferred timezone
  locale: 'en-US', // Change this to your preferred locale

  // Author information
  author: {
    name: 'Tanuj Ravi Rao',
    url: 'https://tansanrao.com',
    email: '', // Add if needed
  },

  // Social links (add as needed)
  social: {
    github: 'https://github.com/tansanrao/tansanrao-com-astro',
  },

  // Content settings
  postsPerPage: 10,
  newsItemsOnHomepage: 3,

  // Theme settings
  defaultTheme: 'system', // 'light', 'dark', or 'system'
} as const;

// Export individual values for convenience
export const { timezone, locale, author } = SITE_CONFIG;
