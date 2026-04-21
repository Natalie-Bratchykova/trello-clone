
export const COLOR_CONFIG = {
    primary_theme:{
        error:{},
        priorities:{
            low:{
                bg: '#e8f5e9',
                color: '#2e7d32' },
            low_medium:{
                bg: '#fff9c4',
                color: '#f57f17' },
            medium:{
                bg: '#fff3e0',
                color: '#e65100' },
            medium_high:{
                bg: '#ffebee',
                color: '#c62828' },
            high:{
                bg: '#d32f2f',
                color: '#fff' },
        },
        button:{
            delete:{
                color:'white',
                bg:'',
                border:'rgba(255,255,255,0.3)',
                hover_border:'#ef5350',
                hover_bg:'rgba(239,83,80,0.15)',
            },
            edit:{
                color:'white',
                bg:'',
                border:'rgba(255,255,255,0.5)',
                hover_bg:'rgba(255,255,255,0.1)',
                hover_border:'white',
            }
        }

    }
}

export  const PRIORITY_CONFIG: Record<string, { labelKey: string; color: string; bg: string; icon: string }> = {
    LOW: { labelKey: 'priority.low', color: COLOR_CONFIG.primary_theme.priorities.low.color, bg: COLOR_CONFIG.primary_theme.priorities.low.bg, icon: '🟢' },
    MEDIUM: { labelKey: 'priority.medium', color: COLOR_CONFIG.primary_theme.priorities.medium.color, bg: COLOR_CONFIG.primary_theme.priorities.medium.bg, icon: '🟠' },
    HIGH: { labelKey: 'priority.high', color: COLOR_CONFIG.primary_theme.priorities.high.color, bg: COLOR_CONFIG.primary_theme.priorities.high.bg, icon: '🔴' },
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG);
export  function getDueDateColors(dueDate: string): { bg: string; color: string } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0)   return COLOR_CONFIG.primary_theme.priorities.high;
    if (diffDays < 5)   return COLOR_CONFIG.primary_theme.priorities.medium_high;
    if (diffDays < 14)  return COLOR_CONFIG.primary_theme.priorities.medium;
    if (diffDays < 30)  return COLOR_CONFIG.primary_theme.priorities.low_medium;
    return COLOR_CONFIG.primary_theme.priorities.low;
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