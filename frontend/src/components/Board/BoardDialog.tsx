import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography
} from "@mui/material";
import {Warning} from "@mui/icons-material";
import {t} from "i18next";
import { useBoardDanger } from '../../context/BoardDangerContext';
import { useBoardFilter } from '../../context/BoardFilterContext';

type BoardDialogType = 'ticket' | 'board'| 'list';
export enum BoardDialogTypeEnum {
    TICKET = 'ticket',
    BOARD = 'board',
    LIST = 'list'
}

interface BoardDialogProps {
    type?: BoardDialogType;
    text:{
        deleteAllTicketsTitle: any;
        deleteAllTicketsConfirm: any;
        willDeleteTickets: any;
        cannotUndo: any;
        cancel: any;
        deleting: any;
        yesDelete: any;
        deleteListConfirm?: any;
    }
}

export  default function BoardDialog({ text, type=BoardDialogTypeEnum.TICKET }: BoardDialogProps){
    const { board, totalCardCount } = useBoardFilter();
    const danger = useBoardDanger();

    // Pick the right open/setOpen/handler/loading based on type
    let open: boolean;
    let setOpen: (v: boolean) => void;
    let handleDelete: () => void;
    let deleting: boolean;

    switch (type) {
        case BoardDialogTypeEnum.LIST:
            open = danger.deleteAllConfirmOpen;
            setOpen = danger.setDeleteAllConfirmOpen;
            handleDelete = danger.handleDeleteAllLists;
            deleting = danger.deletingAllLists;
            break;
        case BoardDialogTypeEnum.TICKET:
        default:
            open = danger.deleteAllTicketsBoardOpen;
            setOpen = danger.setDeleteAllTicketsBoardOpen;
            handleDelete = danger.handleDeleteAllTicketsBoard;
            deleting = danger.deletingAllTicketsBoard;
            break;
    }

    let dialogContent: ((b: any) => React.ReactNode) | string | undefined;
    let countedAmount = totalCardCount;

    if (type === BoardDialogTypeEnum.LIST && board) {
        const nonBacklogLists = board.lists.filter((l) => l.position !== 0);
        countedAmount = nonBacklogLists.length;
    }
    switch (type){
        case BoardDialogTypeEnum.TICKET:
            dialogContent = (b: any) =>{
                return (<Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5, bgcolor: 'error.light', borderRadius: 1}}>
                    <Box sx={{transform:"translateX(8px)"}}>
                        {b.lists.filter((l: any) => l.cards.length > 0).map((l: any) => (
                            <li key={l.id}>
                                <Typography variant="body2">
                                    {l.title}: {l.cards.length}
                                </Typography>
                            </li>
                        ))}
                    </Box>
                </Box>)
            };
            break;
        case BoardDialogTypeEnum.LIST:
            dialogContent = ((b: any) => {
                const nonBacklogLists = b?.lists.filter((l: any) => l.position !== 0) ?? [];
                const totalCards = nonBacklogLists.reduce((sum: number, l: any) => sum + l.cards.length, 0);
                return (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box component="ul" sx={{ m: 0, p: 2,  mt: 0.5, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Box sx={{transform:"translateX(8px)"}}>
                                {nonBacklogLists.map((l: any) => (
                                    <li key={l.id}>
                                        <Typography variant="body2">
                                            {l.title} ({l.cards.length})
                                        </Typography>
                                    </li>
                                ))}
                            </Box>
                        </Box>
                        {totalCards > 0 && (
                            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
                                <Typography variant="body2">
                                    {t('danger.cardsWillMove', { count: totalCards })} <strong>Backlog</strong>.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );
            });
            break;
        case BoardDialogTypeEnum.BOARD:
            dialogContent = text.deleteListConfirm;
            break;
    }

    return(
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="error" />
                {t(text.deleteAllTicketsTitle)}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t(text.deleteAllTicketsConfirm)}
                </DialogContentText>
                <Box sx={{ mt: 2, p: 2, borderRadius: 1, color: 'error.dark' }}>
                    <Typography variant="body2" fontWeight={600}>
                        {t(text.willDeleteTickets, { count: countedAmount } as any)}
                    </Typography>
                    {board && typeof dialogContent === 'function' && dialogContent(board)}
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {t(text.cannotUndo)}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpen(false)} disabled={deleting}>
                    {t(text.cancel)}
                </Button>
                <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
                    {deleting ? t(text.deleting) : `${t(text.yesDelete)} (${countedAmount})`}
                </Button>
            </DialogActions>
        </Dialog>
    )
}