export type PrioritySortMode = 'low-medium-high' | 'high-medium-low' | 'medium-high-low';

export const PRIORITY_SORT_ORDERS: Record<PrioritySortMode, Record<string, number>> = {
    'low-medium-high': { LOW: 1, MEDIUM: 2, HIGH: 3 },
    'high-medium-low': { HIGH: 1, MEDIUM: 2, LOW: 3 },
    'medium-high-low': { MEDIUM: 1, HIGH: 2, LOW: 3 },
};

export const PRIORITY_SORT_LABELS: Record<PrioritySortMode, string> = {
    'low-medium-high': 'Low → Medium → High',
    'high-medium-low': 'High → Medium → Low',
    'medium-high-low': 'Medium → High → Low',
};

export const PRIORITY_SORT_MODES: PrioritySortMode[] = ['low-medium-high', 'high-medium-low', 'medium-high-low'];

export type SortField = 'none' | 'priority' | 'createdAt' | 'dueDate';
export type SortDirection = 'asc' | 'desc';

export const SORT_OPTIONS: { value: SortField; labelKey: string }[] = [
    { value: 'none', labelKey: 'sort.none' },
    { value: 'priority', labelKey: 'sort.byPriority' },
    { value: 'createdAt', labelKey: 'sort.byCreatedAt' },
    { value: 'dueDate', labelKey: 'sort.byDueDate' },
];