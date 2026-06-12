import {useEffect, useState} from "react";
import {Box, Checkbox, Typography} from "@mui/material";
import {parseChecklistItems, toggleChecklistItem} from "../../../helpers/utils/textEditorHelper.ts";

export default function ChecklistRenderer({html, onToggle,}: { html: string; onToggle: (index: number, newHtml: string) => void; }) {
    const [localHtml, setLocalHtml] = useState(html);

    // Sync local state when server data (html prop) changes
    useEffect(() => {
        setLocalHtml(html);
    }, [html]);

    const items = parseChecklistItems(localHtml);

    if (items.length === 0) return null;

    const done = items.filter((i) => i.checked).length;

    const handleToggle = (idx: number) => {
        const updated = toggleChecklistItem(localHtml, idx);
        setLocalHtml(updated);
        onToggle(idx, updated);
    };

    return (
        <Box sx={{ fontSize: '0.875rem' }}>
            {/* Progress bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box
                    sx={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${items.length > 0 ? (done / items.length) * 100 : 0}%`,
                            bgcolor: done === items.length ? 'success.main' : 'primary.main',
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                        }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {done}/{items.length}
                </Typography>
            </Box>

            {/* Checklist items */}
            {items.map((item, i) => (
                <Box
                    key={i}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.25,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'action.hover', borderRadius: 0.5 },
                    }}
                    onClick={() => handleToggle(i)}
                >
                    <Checkbox
                        checked={item.checked}
                        size="small"
                        sx={{ p: 0.25, pointerEvents: 'none' }}
                        tabIndex={-1}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            textDecoration: item.checked ? 'line-through' : 'none',
                            color: item.checked ? 'text.disabled' : 'text.primary',
                            transition: 'all 0.2s ease',
                            lineHeight: 1.6,
                        }}
                    >
                        {item.text}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}