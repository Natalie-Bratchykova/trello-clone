import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CREATE_BOARD_MUTATION = gql`
  mutation CreateBoard($title: String!, $color: String!, $userId: ID!, $boardIdentifier: String) {
    createBoard(data: { title: $title, color: $color, userId: $userId, boardIdentifier: $boardIdentifier }) {
      id
      title
      color
      boardIdentifier
      createdAt
      updatedAt
    }
  }
`;

interface CreateBoardData {
  createBoard: {
    id: string;
    title: string;
    color: string;
    boardIdentifier: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface CreateBoardVars {
  title: string;
  color: string;
  userId: string;
  boardIdentifier?: string;
}

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onBoardCreated: (board: any) => void;
}

// Preset colors for boards
const PRESET_COLORS = [
  { name: 'Синій', value: '#0079bf' },
  { name: 'Зелений', value: '#61bd4f' },
  { name: 'Помаранчевий', value: '#ff9f1a' },
  { name: 'Червоний', value: '#eb5a46' },
  { name: 'Фіолетовий', value: '#c377e0' },
  { name: 'Рожевий', value: '#ff78cb' },
  { name: 'Блакитний', value: '#00c2e0' },
  { name: 'Лаймовий', value: '#51e898' },
  { name: 'Темно-синій', value: '#344563' },
  { name: 'Сірий', value: '#838c91' },
];

export default function CreateBoardDialog({
  open,
  onClose,
  userId,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState('');
  const [boardIdentifier, setBoardIdentifier] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [errors, setErrors] = useState<{ title?: string; boardIdentifier?: string }>({});

  const [createBoard, { loading }] = useMutation<CreateBoardData>(CREATE_BOARD_MUTATION);

  const handleCreateSuccess = (data: CreateBoardData) => {
    if (data.createBoard) {
      onBoardCreated(data.createBoard);
      handleClose();
    }
  };

  const handleCreateError = (error: Error) => {
    console.error('Error creating board:', error);
  };

  const handleClose = () => {
    setTitle('');
    setBoardIdentifier('');
    setSelectedColor(PRESET_COLORS[0].value);
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: { title?: string; boardIdentifier?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Назва проекту обов\'язкова';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Назва має бути мінімум 3 символи';
    } else if (title.length > 50) {
      newErrors.title = 'Назва не може перевищувати 50 символів';
    }

    if (boardIdentifier.trim()) {
      if (boardIdentifier.trim().length < 2) {
        newErrors.boardIdentifier = 'Ідентифікатор має бути мінімум 2 символи';
      } else if (boardIdentifier.trim().length > 10) {
        newErrors.boardIdentifier = 'Ідентифікатор не може перевищувати 10 символів';
      } else if (!/^[A-Za-z0-9-]+$/.test(boardIdentifier.trim())) {
        newErrors.boardIdentifier = 'Ідентифікатор може містити лише літери, цифри та дефіс';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const variables: CreateBoardVars = {
        title: title.trim(),
        color: selectedColor,
        userId,
      };
      if (boardIdentifier.trim()) {
        variables.boardIdentifier = boardIdentifier.trim();
      }

      const result = await createBoard({ variables });

      if (result.data) {
        handleCreateSuccess(result.data);
      }
    } catch (err) {
      if (err instanceof Error) {
        handleCreateError(err);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Створити новий проект
        </Box>
        <Button
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
          disabled={loading}
        >
          <Close />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Назва проекту"
            placeholder="Наприклад: Мій проект"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            disabled={loading}
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            fullWidth
            label="Ідентифікатор проекту"
            placeholder="Наприклад: PROJ або MY-APP"
            value={boardIdentifier}
            onChange={(e) => setBoardIdentifier(e.target.value.toUpperCase())}
            error={!!errors.boardIdentifier}
            helperText={errors.boardIdentifier || 'Необов\'язково. 2-10 символів (літери, цифри, дефіс). Використовується як префікс для карток.'}
            margin="normal"
            disabled={loading}
            inputProps={{ maxLength: 10 }}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Виберіть колір проекту:
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1.5,
                mt: 2,
              }}
            >
              {PRESET_COLORS.map((color) => (
                <Box
                  key={color.value}
                  onClick={() => !loading && setSelectedColor(color.value)}
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: color.value,
                    borderRadius: 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: selectedColor === color.value ? '3px solid' : '2px solid transparent',
                    borderColor: selectedColor === color.value ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': {
                      transform: loading ? 'none' : 'scale(1.1)',
                      boxShadow: loading ? 0 : 2,
                    },
                  }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: 20,
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Preview */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Попередній перегляд:
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderTop: `4px solid ${selectedColor}`,
              }}
            >
              <Typography variant="h6">
                {title.trim() || 'Назва проекту'}
              </Typography>
              {boardIdentifier.trim() && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Ідентифікатор: <strong>{boardIdentifier.trim()}</strong>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Створено: {new Date().toLocaleDateString('uk-UA')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Створення...' : 'Створити проект'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

