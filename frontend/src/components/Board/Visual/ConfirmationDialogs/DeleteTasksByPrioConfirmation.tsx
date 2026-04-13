import {
    Box,
    Button,
    DialogContentText,
    Typography
} from "@mui/material";
import {Warning} from "@mui/icons-material";
import {t} from "i18next";
import {PRIORITY_OPTIONS} from "../../../../helpers/utils/color.ts";
import BaseConfirmation from "./BaseConfirmation.tsx";

export default function DeleteTasksByPrioConfirmation({ deleteByPriorityOpen, setDeleteByPriorityOpen, handleDeleteByPriorityConfirm, bulkDeletingPriority, list, matchingPriorityCards, selectedPriorities}) {

    const title = <>
        <Warning color="error" />
        {t('column.deleteByPriorityTitle')}
    </>;
    const actions = <>
        <Button onClick={() => setDeleteByPriorityOpen(false)} disabled={bulkDeletingPriority}>
            {t('common.cancel')}
        </Button>
        <Button onClick={handleDeleteByPriorityConfirm} variant="contained" color="error" disabled={bulkDeletingPriority}>
            {bulkDeletingPriority ? t('common.deleting') : `${t('deleteConfirm.yesDelete')} (${matchingPriorityCards.length})`}
        </Button>
    </>
    return(
        <BaseConfirmation open={deleteByPriorityOpen} setOpen={setDeleteByPriorityOpen} title={title} actions={actions}>
            <DialogContentText>
                {t('column.deleteByPriorityText')} <strong>"{list.title}"</strong>?
            </DialogContentText>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                <Typography variant="body2" fontWeight={600}>
                    {t('column.willBeDeleted', { count: matchingPriorityCards.length })}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                    {selectedPriorities.map((p) => {
                        const opt = PRIORITY_OPTIONS.find((o) => o[0] === p);
                        const count = list.cards.filter((c) => (c.priority || '') === p).length;
                        return (
                            <Typography key={p} variant="body2">
                                {opt[1]?.icon} {opt ? t(opt[1].labelKey) : ''}: {count} {t('column.tickets')}
                            </Typography>
                        );
                    })}
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {t('column.cannotUndo')}
                </Typography>
            </Box>
        </BaseConfirmation>
    )
}