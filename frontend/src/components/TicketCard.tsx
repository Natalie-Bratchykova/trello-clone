import {Avatar, Box, Chip, Paper, Typography} from "@mui/material";
import {useDrag} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";

function getDueDateColors(dueDate: string): { bg: string; color: string } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0)   return { bg: '#d32f2f', color: '#fff' };       // overdue — dark red
    if (diffDays < 5)   return { bg: '#ffebee', color: '#c62828' };     // < 5 days — red
    if (diffDays < 14)  return { bg: '#fff3e0', color: '#e65100' };     // < 2 weeks — orange
    if (diffDays < 30)  return { bg: '#fff9c4', color: '#f57f17' };     // < 1 month — yellow
    return { bg: '#e8f5e9', color: '#2e7d32' };                         // > 1 month — green
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    LOW: { label: 'Low', color: '#2e7d32', bg: '#e8f5e9' },
    MEDIUM: { label: 'Medium', color: '#e65100', bg: '#fff3e0' },
    HIGH: { label: 'High', color: '#c62828', bg: '#ffebee' },
};

export interface TicketCardProps {
    card:{
        id:string;
        title:string;
        description?:string;
        position:number;
        dueDate?:string;
        suffix?:string;
        priority?:string;
        createdAt?:string;
        updatedAt?:string;
        listId?:string;
        user?:{
            id:string;
            name:string;
            email?:string;
            profileImage?:string;
        }
    };
    onClick?: () => void;
}
export default function TicketCard({card, onClick}:TicketCardProps) {
    const [{opacity}, dragRef] = useDrag(
        () => ({
            type: ItemTypes.TICKET,
            item: { type: ItemTypes.TICKET, ...card },
            collect: (monitor) => ({
                opacity: monitor.isDragging() ? 0.5 : 1,
            }),

        })
    );
    return(
        <Paper
            ref={dragRef}
            onClick={onClick}
            sx={{
                p: 1.5,
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
            }}
            elevation={1}
        >
            {card.suffix && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
                >
                    {card.suffix}
                </Typography>
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {card.title}
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    mt: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {card.priority && PRIORITY_CONFIG[card.priority] && (
                        <Chip
                            label={PRIORITY_CONFIG[card.priority].label}
                            size="small"
                            sx={{
                                backgroundColor: PRIORITY_CONFIG[card.priority].bg,
                                color: PRIORITY_CONFIG[card.priority].color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 22,
                            }}
                        />
                    )}
                    {card.dueDate && (() => {
                        const dueDate = card.dueDate!;
                        const dueDateColors = getDueDateColors(dueDate);
                        return (
                            <Typography
                                variant="caption"
                                sx={{
                                    backgroundColor: dueDateColors.bg,
                                    color: dueDateColors.color,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                    fontWeight: 600,
                                }}
                            >
                                {new Date(dueDate).toLocaleDateString('uk-UA')}
                            </Typography>
                        );
                    })()}
                </Box>
                {card.user && (
                    <Avatar
                        src={card.user.profileImage ? `http://localhost:3000${card.user.profileImage}` : undefined}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
                    >
                        {!card.user.profileImage && card.user.name?.[0]?.toUpperCase()}
                    </Avatar>
                )}
            </Box>
        </Paper>
    )
}