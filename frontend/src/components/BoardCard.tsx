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
import {useDrag} from "react-dnd";
import {ItemTypes} from "../helpers/types/ItemTypes.ts";

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
  isDropped?: boolean;
}

export default function BoardCard({ board, onDelete, isDropped }: BoardCardProps) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/board/${board.id}`);
  };

  const [{opacity}, dragRef] = useDrag(
    () => ({
      type: ItemTypes.BOARD_CARD,
      item: { id: board.id, type: ItemTypes.BOARD_CARD },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),

    })
  );


  return (
    <Card ref={dragRef}
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
        opacity
      }}
    >
      <CardContent sx={{ flexGrow: 1 }} >
        <Typography variant="h6" component="div" gutterBottom>
          {board.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {board.listsCount !== undefined && (
            <Chip
              label={`${board.listsCount} списків`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {board.cardsCount !== undefined && (
            <Chip
              label={`${board.cardsCount} карток`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Створено: {new Date(board.createdAt).toLocaleDateString('uk-UA')}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={handleOpen}
          variant="contained"
        >
          Відкрити
        </Button>
        <Box>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => navigate(`/board/${board.id}/edit`)}
          >
            Редагувати
          </Button>
          {onDelete && (
            <Button
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => onDelete(board.id)}
            >
              Видалити
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
}

