export  const PRIORITY_CONFIG: Record<string, { labelKey: string; color: string; bg: string; icon: string }> = {
    LOW: { labelKey: 'priority.low', color: '#2e7d32', bg: '#e8f5e9', icon: '🟢' },
    MEDIUM: { labelKey: 'priority.medium', color: '#e65100', bg: '#fff3e0', icon: '🟠' },
    HIGH: { labelKey: 'priority.high', color: '#c62828', bg: '#ffebee', icon: '🔴' },
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG);
export  function getDueDateColors(dueDate: string): { bg: string; color: string } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0)   return { bg: '#d32f2f', color: '#fff' };
    if (diffDays < 5)   return { bg: '#ffebee', color: '#c62828' };
    if (diffDays < 14)  return { bg: '#fff3e0', color: '#e65100' };
    if (diffDays < 30)  return { bg: '#fff9c4', color: '#f57f17' };
    return { bg: '#e8f5e9', color: '#2e7d32' };
}

export function getDueDateLabel(dueDate: string, t: any): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return t('dueDate.overdue', { days: Math.abs(diffDays) });
    if (diffDays === 0) return t('dueDate.today');
    if (diffDays === 1) return t('dueDate.tomorrow');
    if (diffDays < 7) return t('dueDate.inDays', { days: diffDays });
    if (diffDays < 30) return t('dueDate.inWeeks', { weeks: Math.floor(diffDays / 7) });
    return t('dueDate.inMonths', { months: Math.floor(diffDays / 30) });
}

export function definePriorityLabel(priorityName):string{
    return priorityName === 'HIGH' ? '🔴' : priorityName === 'MEDIUM' ? '🟠' : '🟢';
}