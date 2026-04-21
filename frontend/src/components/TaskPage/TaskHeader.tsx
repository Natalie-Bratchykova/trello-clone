import { Box, Container, IconButton, Button, Typography } from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import type { TFunction } from 'i18next';
import {COLOR_CONFIG} from "../../helpers/utils/color.ts";
interface TaskHeaderProps {
  card: {
    suffix?: string;
  };
  boardColor: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: TFunction;
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
              color: COLOR_CONFIG.primary_theme.button.edit.color,
              borderColor: COLOR_CONFIG.primary_theme.button.edit.border,
              textTransform: 'none',
              '&:hover': { borderColor: COLOR_CONFIG.primary_theme.button.edit.hover_border, backgroundColor: COLOR_CONFIG.primary_theme.button.edit.hover_bg },
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={onDelete}
            sx={{
              color: COLOR_CONFIG.primary_theme.button.delete.color,
              borderColor: COLOR_CONFIG.primary_theme.button.delete.border,
              textTransform: 'none',
              '&:hover': { borderColor: COLOR_CONFIG.primary_theme.button.delete.hover_border, backgroundColor: COLOR_CONFIG.primary_theme.button.delete.hover_bg },
            }}
          >
            {t('common.delete')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

