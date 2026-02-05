/**
 * Date and time configuration and utilities for consistent formatting across the site
 */

import { SITE_CONFIG } from '@config/site';

// Site-wide date/time configuration
export const DATE_CONFIG = {
    // Default timezone for the site
    timezone: SITE_CONFIG.timezone,

    // Default locale for formatting
    locale: SITE_CONFIG.locale,

    // Standard date format options
    formats: {
        // Full date: "January 10, 2025"
        full: {
            year: 'numeric' as const,
            month: 'long' as const,
            day: 'numeric' as const
        },

        // Short date: "Jan 10, 2025"
        short: {
            year: 'numeric' as const,
            month: 'short' as const,
            day: 'numeric' as const
        },

        // Compact date: "01/10/2025"
        compact: {
            year: 'numeric' as const,
            month: '2-digit' as const,
            day: '2-digit' as const
        },

        // Year only: "2025"
        year: {
            year: 'numeric' as const
        },

        // Month and day: "Jan 10"
        monthDay: {
            month: 'short' as const,
            day: 'numeric' as const
        },

        // Full with time: "January 10, 2025 at 3:30 PM"
        fullWithTime: {
            year: 'numeric' as const,
            month: 'long' as const,
            day: 'numeric' as const,
            hour: 'numeric' as const,
            minute: '2-digit' as const,
            timeZoneName: 'short' as const
        }
    }
} as const;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const HAS_TIMEZONE_PATTERN = /(?:[+-]\d{2}:?\d{2}|Z|GMT|UTC)$/i;

const TZ_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: DATE_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

function parseIntOrZero(value?: string): number {
    return value ? Number.parseInt(value, 10) : 0;
}

function getTimezoneParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
} {
    const parts = TZ_FORMATTER.formatToParts(date);

    const pick = (type: Intl.DateTimeFormatPartTypes): number => {
        const value = parts.find((part) => part.type === type)?.value;
        return value ? Number.parseInt(value, 10) : 0;
    };

    return {
        year: pick('year'),
        month: pick('month'),
        day: pick('day'),
        hour: pick('hour'),
        minute: pick('minute'),
        second: pick('second')
    };
}

function convertWallTimeToDate(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number
): Date {
    const target = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    let guess = new Date(target);

    for (let i = 0; i < 4; i += 1) {
        const current = getTimezoneParts(guess);
        const currentAsUtc = Date.UTC(
            current.year,
            current.month - 1,
            current.day,
            current.hour,
            current.minute,
            current.second,
            millisecond
        );

        const diffMs = target - currentAsUtc;

        if (diffMs === 0) {
            break;
        }

        guess = new Date(guess.getTime() + diffMs);
    }

    return guess;
}

/**
 * Parse frontmatter date inputs.
 * Supports:
 * - YYYY-MM-DD
 * - YYYY-MM-DD HH:mm (or with T separator)
 * - full ISO strings (with timezone)
 */
export function parseDateInput(value: Date | string): Date {
    if (value instanceof Date) {
        return value;
    }

    const dateStr = value.trim();

    const dateOnlyMatch = dateStr.match(DATE_ONLY_PATTERN);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return convertWallTimeToDate(
            Number.parseInt(year, 10),
            Number.parseInt(month, 10),
            Number.parseInt(day, 10),
            0,
            0,
            0,
            0
        );
    }

    const dateTimeMatch = dateStr.match(DATE_TIME_PATTERN);
    if (dateTimeMatch && !HAS_TIMEZONE_PATTERN.test(dateStr)) {
        const [, year, month, day, hour, minute, second, millisecond] = dateTimeMatch;
        return convertWallTimeToDate(
            Number.parseInt(year, 10),
            Number.parseInt(month, 10),
            Number.parseInt(day, 10),
            Number.parseInt(hour, 10),
            Number.parseInt(minute, 10),
            parseIntOrZero(second),
            parseIntOrZero(millisecond)
        );
    }

    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date value: \"${value}\"`);
    }

    return parsed;
}

/**
 * Ensures a date is interpreted in the configured timezone if no timezone is specified
 */
export function ensureTimezone(date: Date | string): Date {
    return parseDateInput(date);
}

/**
 * Format a date using the configured timezone and locale
 */
export function formatDate(
    date: Date | string,
    format: keyof typeof DATE_CONFIG.formats = 'short',
    options?: {
        timezone?: string;
        locale?: string;
    }
): string {
    const processedDate = ensureTimezone(date);
    const timezone = options?.timezone || DATE_CONFIG.timezone;
    const locale = options?.locale || DATE_CONFIG.locale;

    return processedDate.toLocaleDateString(locale, {
        ...DATE_CONFIG.formats[format],
        timeZone: timezone
    });
}

/**
 * Format a date with time using the configured timezone and locale
 */
export function formatDateTime(
    date: Date | string,
    options?: {
        timezone?: string;
        locale?: string;
        includeTimezone?: boolean;
    }
): string {
    const processedDate = ensureTimezone(date);
    const timezone = options?.timezone || DATE_CONFIG.timezone;
    const locale = options?.locale || DATE_CONFIG.locale;

    const formatOptions: Intl.DateTimeFormatOptions = {
        ...DATE_CONFIG.formats.fullWithTime,
        timeZone: timezone
    };

    if (options?.includeTimezone === false) {
        delete formatOptions.timeZoneName;
    }

    return processedDate.toLocaleDateString(locale, formatOptions);
}

/**
 * Get the current year in the configured timezone
 */
export function getCurrentYear(): number {
    return Number.parseInt(
        new Date().toLocaleDateString(DATE_CONFIG.locale, {
            year: 'numeric',
            timeZone: DATE_CONFIG.timezone
        }),
        10
    );
}

/**
 * Get the current date formatted for display
 */
export function getCurrentDate(format: keyof typeof DATE_CONFIG.formats = 'short'): string {
    return formatDate(new Date(), format);
}

/**
 * Get the build date formatted for display
 */
export function getBuildDate(format: keyof typeof DATE_CONFIG.formats = 'short'): string {
    return formatDate(new Date(), format);
}

/**
 * Sort dates in descending order (newest first)
 */
export function sortDatesByNewest<T extends { data: { pubDate: Date } }>(items: T[]): T[] {
    return items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Sort dates in ascending order (oldest first)
 */
export function sortDatesByOldest<T extends { data: { pubDate: Date } }>(items: T[]): T[] {
    return items.sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
}

/**
 * Extract unique years from a collection of dated items
 */
export function extractYears<T extends { data: { pubDate: Date } }>(
    items: T[],
    sort: 'asc' | 'desc' = 'desc'
): string[] {
    const years = [
        ...new Set(
            items.map((item) => {
                const processedDate = ensureTimezone(item.data.pubDate);
                return processedDate.toLocaleDateString(DATE_CONFIG.locale, {
                    year: 'numeric',
                    timeZone: DATE_CONFIG.timezone
                });
            })
        )
    ];

    return sort === 'desc'
        ? years.sort((a, b) => parseInt(b) - parseInt(a))
        : years.sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Check if a date is in a specific year
 */
export function isDateInYear(date: Date | string, year: string): boolean {
    const processedDate = ensureTimezone(date);
    const dateYear = processedDate.toLocaleDateString(DATE_CONFIG.locale, {
        year: 'numeric',
        timeZone: DATE_CONFIG.timezone
    });
    return dateYear === year;
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date | string): string {
    const processedDate = ensureTimezone(date);
    const now = new Date();
    const diffMs = now.getTime() - processedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            if (diffMinutes < 1) return 'just now';
            return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        }
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays === -1) {
        return 'tomorrow';
    } else if (diffDays < 0) {
        return `in ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    } else {
        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
    }
}

/**
 * Get a Date object for a specified number of years ago
 */
export function getDateYearsAgo(years: number): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
}
