import {Box, Button, Dialog,DialogActions, DialogContent, DialogContentText, DialogTitle, Typography} from "@mui/material";
import {t} from "i18next";
import {CleaningServices} from "@mui/icons-material";
import BaseConfirmation from "./BaseConfirmation.tsx";

export default function ClearListConfirmation({clearConfirmOpen, setClearConfirmOpen, handleClearConfirm, clearing, list}) {

    const title = <>
        <CleaningServices color="warning" />
        {t('column.clearConfirmTitle')}
    </>;
    const dialogActions = <>
        <Button onClick={() => setClearConfirmOpen(false)} disabled={clearing}>
            {t('common.cancel')}
        </Button>
        <Button onClick={handleClearConfirm} variant="contained" color="warning" disabled={clearing}>
            {clearing ? t('column.moving') : t('column.yesClear')}
        </Button>
    </>;

    return  (
    <BaseConfirmation open={clearConfirmOpen} setOpen={setClearConfirmOpen} title={title} actions={dialogActions} >
        <DialogContentText>
            {t('column.clearConfirmText')} <strong>"{list.title}"</strong>?
        </DialogContentText>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
            <Typography variant="body2">
                {t('column.clearInfo', { count: list.cards.length })} <strong>{t('column.backlog')}</strong>.
            </Typography>
        </Box>
    </BaseConfirmation>)
}