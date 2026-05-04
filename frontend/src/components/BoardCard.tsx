import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {useDrag} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";
import {formatDate} from "../helpers/utils/dateLocale.ts";

interface BoardCardProps {
  board: {
    id: string;
    title: string;
    color: string;
    createdAt: string;
    listsCount?: number;
    cardsCount?: number;
  };
  onDelete?: (id: string) => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleOpen = () => {
    navigate(`/board/${board.id}`);
  };


  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        borderTop: `4px solid ${board.color}`,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }} >
        <Typography variant="h6" component="div" gutterBottom>
          {board.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {board.lists.length !== undefined && (
            <Chip
              label={`${board.lists.length} ${t('board.lists')}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {t('board.created')}: {formatDate(i18n.language, board.createdAt, false)}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={handleOpen}
          variant="contained"
        >
          {t('board.open')}
        </Button>
        <Box>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => navigate(`/board/${board.id}/edit`)}
          >
            {t('board.editBoard')}
          </Button>
          {onDelete && (
            <Button
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => onDelete(board.id)}
            >
              {t('board.deleteBoard')}
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}
