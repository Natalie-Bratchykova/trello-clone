import {
    Box,
    Button,
    DialogContentText,
    Typography
} from "@mui/material";
import {Warning} from "@mui/icons-material";
import {t} from "i18next";
import BaseConfirmation from "./BaseConfirmation.tsx";

export default function DeleteAllTicketsConfirmation ({deleteAllTicketsOpen,setDeleteAllTicketsOpen, handleDeleteAllTicketsConfirm,bulkDeletingAll, list  }){

    const title = <>
        <Warning color="error" />
        {t('column.deleteAllConfirmTitle')}
    </>;

    const actions = <>
        <Button onClick={() => setDeleteAllTicketsOpen(false)} disabled={bulkDeletingAll}>
            {t('common.cancel')}
        </Button>
        <Button onClick={handleDeleteAllTicketsConfirm} variant="contained" color="error" disabled={bulkDeletingAll}>
            {bulkDeletingAll ? t('common.deleting') : t('column.yesDeleteAll')}
        </Button>
    </>;

     return(
     <BaseConfirmation open={deleteAllTicketsOpen} setOpen={setDeleteAllTicketsOpen} title={title} actions={actions}>
         <DialogContentText>
             {t('column.deleteAllConfirmText')} <strong>"{list.title}"</strong>?
         </DialogContentText>
         <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
             <Typography variant="body2" fontWeight={600}>
                 {t('column.deleteAllInfo', { count: list.cards.length })}
             </Typography>
             <Typography variant="body2" sx={{ mt: 0.5 }}>
                 {t('column.cannotUndo')}
             </Typography>
         </Box>
     </BaseConfirmation>
     )
}