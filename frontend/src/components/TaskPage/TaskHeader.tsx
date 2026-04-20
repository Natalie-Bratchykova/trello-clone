import { Box, Container, IconButton, Button, Typography } from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';

interface TaskHeaderProps {
  card: {
    suffix?: string;
  };
  boardColor: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: any;
}

export default function TaskHeader({ card, boardColor, onBack, onEdit, onDelete, t }: TaskHeaderProps) {
  return (
    <Box sx={{ backgroundColor: boardColor, color: 'white', py: 2, px: 3, mb: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            {card.suffix && (
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>
                {card.suffix}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={onEdit}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={onDelete}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              textTransform: 'none',
              '&:hover': { borderColor: '#ef5350', backgroundColor: 'rgba(239,83,80,0.15)' },
            }}
          >
            {t('common.delete')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

