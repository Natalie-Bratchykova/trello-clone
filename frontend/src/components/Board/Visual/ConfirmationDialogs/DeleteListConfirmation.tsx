import {
    Box,
    Button,
    DialogContentText,
    Typography
} from "@mui/material";
import {Warning} from "@mui/icons-material";
import {t} from "i18next";
import BaseConfirmation from "./BaseConfirmation.tsx";

export default  function DeleteListConfirmation({deleteConfirmOpen, setDeleteConfirmOpen, handleDeleteConfirm, deleting, list}) {

    let title = <>
        <Warning color="error" />
        {t('column.deleteListTitle')}
    </>;

    let actions = <>
        <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            {t('common.cancel')}
        </Button>
        <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}>
            {deleting ? t('common.deleting') : t('deleteConfirm.yesDelete')}
        </Button>
    </>;

    return(
        <BaseConfirmation open={deleteConfirmOpen} setOpen={setDeleteConfirmOpen} title={title} actions={actions}>
            <DialogContentText>
                {t('column.deleteListText')} <strong>"{list?.title}"</strong>?
            </DialogContentText>
            {list?.cards.length > 0 ? (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
                    <Typography variant="body2">
                        {t('column.deleteListCardsInfo', { count: list?.cards.length })} <strong>{t('column.backlog')}</strong>.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, color: 'text.secondary' }}>
                    <Typography variant="body2">
                        {t('column.emptyListInfo')}
                    </Typography>
                </Box>
            )}
        </BaseConfirmation>
    )
}