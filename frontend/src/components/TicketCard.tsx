import {Avatar, Box, Chip, Paper, Typography} from "@mui/material";
import {useDrag} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";
import {formatDate} from "../helpers/utils/dateLocale.ts";
import i18n, {t} from "i18next";
import {getUserProfileUrl} from "../helpers/utils/userHelper.ts";
import {getDueDateColors, PRIORITY_CONFIG} from "../helpers/utils/color.ts";



export interface TicketCardProps {
    card:{
        id:string;
        title:string;
        description?:string;
        position:number;
        dueDate?:string;
        suffix?:string;
        priority?:string;
        type?:string;
        createdAt?:string;
        updatedAt?:string;
        listId?:string;
        user?:{
            id:string;
            name:string;
            email?:string;
            profileImage?:string;
        };
        releaseTasks?:{
            id:string;
            title:string;
            suffix?:string;
        }[];
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
            {card.type === 'RELEASE' && (
                <Chip
                    label="🚀 Release"
                    size="small"
                    sx={{
                        mb: 0.5,
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: '#e3f2fd',
                        color: '#1565c0',
                    }}
                />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {card.title}
            </Typography>
            {card.type === 'RELEASE' && card.releaseTasks && card.releaseTasks.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    📋 {card.releaseTasks.length} task{card.releaseTasks.length !== 1 ? 's' : ''} linked
                </Typography>
            )}
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
                            label={t(PRIORITY_CONFIG[card.priority].labelKey)}
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
                                {formatDate(i18n.language, dueDate, false)}
                            </Typography>
                        );
                    })()}
                </Box>
                {card.user && (
                    <Avatar
                        src={getUserProfileUrl(card.user.profileImage)}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
                    >
                        {!card.user.profileImage && card.user.name?.[0]?.toUpperCase()}
                    </Avatar>
                )}
            </Box>
        </Paper>
    )
}