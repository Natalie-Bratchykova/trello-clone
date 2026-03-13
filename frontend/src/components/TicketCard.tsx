import {Box, Paper, Typography} from "@mui/material";
import {useDrag} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";

export interface TicketCardProps {
    card:{
        id:string;
        title:string;
        description?:string;
        position:number;
        dueDate?:string;
        user?:{
            id:string;
            name:string;
        }
    }
}
export default function TicketCard({card}:TicketCardProps) {
    console.log(card)
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
            sx={{
                p: 1.5,
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
            }}
            elevation={1}
        >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {card.title}
            </Typography>
            {card.description && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 0.5,
                    }}
                >
                    {card.description}
                </Typography>
            )}
            {(card.dueDate || card.user) && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    {card.dueDate && (
                        <Typography
                            variant="caption"
                            sx={{
                                backgroundColor: 'warning.light',
                                color: 'warning.dark',
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                            }}
                        >
                            {new Date(card.dueDate).toLocaleDateString('uk-UA')}
                        </Typography>
                    )}
                    {card.user && (
                        <Typography
                            variant="caption"
                            sx={{
                                backgroundColor: 'primary.light',
                                color: 'primary.dark',
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                            }}
                        >
                            {card.user.name}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    )
}