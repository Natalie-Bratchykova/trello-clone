import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardTitle: string;
  loading?: boolean;
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  boardTitle,
  loading = false,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="error" />
        <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {t('deleteConfirm.deleteProject')}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('deleteConfirm.deleteProjectConfirm')} <strong>"{boardTitle}"</strong>?
        </DialogContentText>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'error.light',
            borderRadius: 1,
            color: 'error.dark',
          }}
        >
          <Typography variant="body2">
            {t('deleteConfirm.deleteProjectWarning')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? t('common.deleting') : t('deleteConfirm.yesDelete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
