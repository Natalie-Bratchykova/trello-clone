import { DialogTitle, Box, Typography, Button, IconButton, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit, Delete, Close } from '@mui/icons-material';

interface DialogHeaderProps {
  card: {
    id: string;
    suffix?: string;
    title: string;
  };
  displayListTitle: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  t: any;
}

export default function DialogHeader({ card, displayListTitle, onEdit, onDelete, onClose, t }: DialogHeaderProps) {
  return (
    <DialogTitle
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        pb: 1,
      }}
    >
      <Box sx={{ flex: 1, pr: 2 }}>
        {card.suffix && (
          <Link
            component={RouterLink}
            to={`/task/${card.id}`}
            underline="hover"
            sx={{ fontWeight: 600, mb: 0.5, display: 'block', fontSize: '0.75rem' }}
          >
            {card.suffix}
          </Link>
        )}
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {card.title}
        </Typography>
        {displayListTitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('ticketDetail.inList')} <strong>{displayListTitle}</strong>
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Edit />}
          onClick={onEdit}
          sx={{ textTransform: 'none' }}
        >
          {t('common.edit')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<Delete />}
          onClick={onDelete}
          sx={{ textTransform: 'none' }}
        >
          {t('common.delete')}
        </Button>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}

