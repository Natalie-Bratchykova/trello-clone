import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Box, Typography} from "@mui/material";
import {Warning} from "@mui/icons-material";

export default function DeleteCartDialog({deleteConfirmOpen, setDeleteConfirmOpen, card, handleDelete, deleting, t}) {
    return(
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="error" />
                {t('deleteConfirm.deleteTask')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('deleteConfirm.deleteTaskConfirm')} <strong>"{card.title}"</strong>?
                </DialogContentText>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                    <Typography variant="body2">
                        {t('deleteConfirm.deleteTaskWarning')}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
                    {deleting ? t('common.deleting') : t('deleteConfirm.yesDelete')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}