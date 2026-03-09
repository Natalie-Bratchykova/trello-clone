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
          Видалити проект?
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Ви дійсно хочете видалити проект <strong>"{boardTitle}"</strong>?
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
            ⚠️ Це також видалить всі списки та картки в цьому проекті. Цю дію не можна скасувати.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Скасувати
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? 'Видалення...' : 'Так, видалити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

