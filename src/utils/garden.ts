import type { CollectionEntry } from 'astro:content';
import { DATE_CONFIG, ensureTimezone } from '@utils/datetime';

export type GardenEntry = CollectionEntry<'garden'>;

export const SORT_TYPES = ['newest', 'updated', 'alphabetical'] as const;
export type SortType = (typeof SORT_TYPES)[number];

export const SORT_LABELS: Record<SortType, string> = {
    newest: 'Newest',
    updated: 'Last edited',
    alphabetical: 'Alphabetical'
};

export interface TopicOption {
    label: string;
    slug: string;
    count: number;
}

export function normalizeSortType(value?: string): SortType {
    if (!value) return 'newest';
    return SORT_TYPES.includes(value as SortType) ? (value as SortType) : 'newest';
}

export function sortGardenEntries(entries: GardenEntry[], sort: SortType): GardenEntry[] {
    const items = [...entries];

    switch (sort) {
        case 'alphabetical':
            return items.sort((a, b) =>
                a.data.title.localeCompare(b.data.title, DATE_CONFIG.locale, { sensitivity: 'base' })
            );
        case 'updated':
            return items.sort((a, b) => getUpdatedValue(b) - getUpdatedValue(a));
        case 'newest':
        default:
            return items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    }
}

export function getTopicsWithCounts(entries: GardenEntry[]): TopicOption[] {
    const counts = new Map<string, number>();

    entries.forEach((entry) => {
        entry.data.topics.forEach((topic) => {
            counts.set(topic, (counts.get(topic) || 0) + 1);
        });
    });

    return [...counts.entries()]
        .map(([label, count]) => ({
            label,
            slug: slugifyTopic(label),
            count
        }))
        .sort((a, b) =>
            a.label.localeCompare(b.label, DATE_CONFIG.locale, { sensitivity: 'base' })
        );
}

export function getTopicBySlug(topics: TopicOption[], slug?: string): TopicOption | undefined {
    if (!slug) return undefined;
    return topics.find((topic) => topic.slug === slug);
}

export function slugifyTopic(topic: string): string {
    return topic
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getGardenSortUrl(sort: SortType): string {
    return sort === 'newest' ? '/garden' : `/garden/sort/${sort}`;
}

export function getGardenTopicSortUrl(topicSlug: string, sort: SortType): string {
    return `/garden/${topicSlug}/${sort}`;
}

export function getGardenNoteUrl(topicSlug: string, noteSlug: string): string {
    return `/garden/${topicSlug}/${noteSlug}`;
}

function getUpdatedValue(entry: GardenEntry): number {
    return ensureTimezone(entry.data.updatedDate ?? entry.data.pubDate).valueOf();
}
