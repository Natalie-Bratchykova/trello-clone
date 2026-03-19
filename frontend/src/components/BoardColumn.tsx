import {Box, Button, IconButton, Paper, Typography} from "@mui/material";
import {Add, MoreVert} from "@mui/icons-material";
import TicketCard from "./TicketCard.tsx";
import {useDrop} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";

export interface BoardColumnProps {
    list:{
        id:string;
        title:string;
        position:number;
        cards:{
            id:number;
            title:string;
            description:string;
            position:number;
            dueDate:string | null;
            user:{
                id:number;
                name:string;
            } | null;
        }[];

    };
    lastDroppedCardId?:string | null;
    onDrop:(item:any)=>void;
    onCardClick?:(card: any, listTitle: string) => void;
    setCardDialogState:(state:{open: boolean, listId: string, listTitle: string}) => void;

}

export default function BoardColumn ({list, setCardDialogState, lastDroppedCardId, onDrop, onCardClick}:BoardColumnProps) {


    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: [ItemTypes.TICKET],
        drop: onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });
    return(
        <Paper
            ref={dropRef}
            sx={{
                minWidth: 300,
                maxWidth: 300,
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 250px)',
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {list.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            backgroundColor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                        }}
                    >
                        {list.cards.length}
                    </Typography>
                    <IconButton size="small">
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Cards */}
            <Box
                sx={{
                    p: 1,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {[...list.cards]
                    .sort((a, b) => a.position - b.position)
                    .map((card) => (
                    <TicketCard key={card.id} card={card} onClick={() => onCardClick?.(card, list.title)} />
                    ))}
            </Box>

            {/* Add Card Button */}
            <Box sx={{ p: 1 }}>
                <Button
                    fullWidth
                    startIcon={<Add />}
                    sx={{ justifyContent: 'flex-start' }}
                    onClick={() =>
                        setCardDialogState({
                            open: true,
                            listId: list.id,
                            listTitle: list.title,
                        })
                    }
                >
                    Додати картку
                </Button>
            </Box>
        </Paper>
    );
};