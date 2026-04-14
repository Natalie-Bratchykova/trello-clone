import {formatDate} from "./dateLocale.ts";

export const  parseChecklistItems  = function (html: string): { checked: boolean; text: string }[]{
    const states = getCheckStates(html);
    const div = document.createElement('div');
    div.innerHTML = html;
    const textContent = div.textContent || '';
    const items: { checked: boolean; text: string }[] = [];

    const regex = /[☐☑]\s*(.*?)(?=[☐☑]|$)/gs;
    let m;
    let idx = 0;
    while ((m = regex.exec(textContent)) !== null) {
        items.push({
            checked: states[idx] ?? false,
            text: m[1].trim(),
        });
        idx++;
    }
    return items;
}

export const QUILL_MODULES = function(isComment = true) {
    let toolbars = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ color: [] }, { background: [] }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean'],
        ],
    }
    if (!isComment) {
         toolbars.toolbar.unshift([{ header: [1, 2, 3, false] }]), toolbars;
    }
        return toolbars;

};

export const QUILL_FORMATS = function (isComment = true) {
    let formats = [
        'bold', 'italic', 'underline', 'strike',
        'list',
        'color', 'background',
        'blockquote', 'code-block',
        'link',
    ];
    if (!isComment) {
         formats.unshift('header');
    }
        return formats;

}

export const COMMENT_QUILL_FORMATS = [
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote', 'code-block',
    'link',
];


export function isQuillContentEmpty(html: string): boolean {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    return stripped.length === 0;
}

export function descriptionToChecklist(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    const items: string[] = [];

    const listItems = div.querySelectorAll('li');
    if (listItems.length > 0) {
        listItems.forEach((li) => {
            const text = li.textContent?.trim();
            if (text) items.push(text);
        });
    } else {
        const blocks = div.querySelectorAll('p, h1, h2, h3, div');
        if (blocks.length > 0) {
            blocks.forEach((block) => {
                const text = block.textContent?.trim();
                if (text) items.push(text);
            });
        } else {
            const text = div.textContent || '';
            text.split(/\n+/).forEach((line) => {
                const trimmed = line.trim();
                if (trimmed) items.push(trimmed);
            });
        }
    }

    if (items.length === 0) return '';
    return items
        .map((item) => `<p>☐ ${item}</p>`)
        .join('');
}


export function isChecklist(html: string): boolean {
    return /[☐☑]/.test(html);
}

export function toggleChecklistItem(html: string, targetIndex: number): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    let checkIndex = 0;

    const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            const replaced = text.replace(/[☐☑]/g, (match) => {
                if (checkIndex === targetIndex) {
                    checkIndex++;
                    return match === '☐' ? '☑' : '☐';
                }
                checkIndex++;
                return match;
            });
            if (replaced !== text) {
                node.textContent = replaced;
            }
        } else {
            node.childNodes.forEach(walk);
        }
    };
    walk(div);
    return div.innerHTML;
}

export function getCheckStates(html: string): boolean[] {
    const states: boolean[] = [];
    const regex = /[☐☑]/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
        states.push(m[0] === '☑');
    }
    return states;
}

export function formatRelativeTime(dateStr: string, t: any, lang: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('comments.justNow');
    if (diffMin < 60) return t('comments.minutesAgo', { count: diffMin });
    if (diffHours < 24) return t('comments.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('comments.daysAgo', { count: diffDays });
    return formatDate(lang, dateStr, false)
}