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
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CREATE_CARD_MUTATION = gql`
  mutation CreateCard($title: String!, $description: String, $listId: ID!, $dueDate: DateTime) {
    createCard(data: { title: $title, description: $description, listId: $listId, dueDate: $dueDate }) {
      id
      title
      description
      position
      dueDate
    }
  }
`;

interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  onCardCreated: () => void;
}

export default function CreateCardDialog({
  open,
  onClose,
  listId,
  listTitle,
  onCardCreated,
}: CreateCardDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  const [createCard, { loading }] = useMutation(CREATE_CARD_MUTATION);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Назва картки обов\'язкова';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Назва має бути мінімум 2 символи';
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
      const result = await createCard({
        variables: {
          title: title.trim(),
          description: description.trim() || undefined,
          listId,
          dueDate: dueDate || undefined,
        },
      });

      if (result.data) {
        onCardCreated();
        handleClose();
      }
    } catch (err) {
      console.error('Error creating card:', err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box component="span" sx={{ display: 'block', fontSize: '1.25rem', fontWeight: 600 }}>
            Створити картку
          </Box>
          <Typography variant="caption" color="text.secondary">
            у списку "{listTitle}"
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Назва картки"
            placeholder="Наприклад: Зробити дизайн головної сторінки"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Опис (опціонально)"
            placeholder="Додайте детальний опис..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Дата виконання (опціонально)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            margin="normal"
            disabled={loading}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Скасувати
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Створення...' : 'Створити картку'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

