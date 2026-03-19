import { useState, useEffect } from 'react';
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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const GET_USERS_QUERY = gql`
  query GetUsersForEdit {
    users {
      id
      name
      email
    }
  }
`;

const UPDATE_CARD_MUTATION = gql`
  mutation UpdateCard($id: ID!, $data: UpdateCardInput!) {
    updateCard(id: $id, data: $data) {
      id
      title
      description
      position
      dueDate
      priority
      suffix
      listId
      userId
      createdAt
      updatedAt
      user {
        id
        name
        email
        profileImage
      }
      list {
        id
        title
        board {
          id
          title
          color
        }
      }
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface GetUsersData {
  users: User[];
}

interface UpdateCardData {
  updateCard: {
    id: string;
    title: string;
    description: string;
    position: number;
    dueDate: string;
    priority: string;
    suffix: string;
    listId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user: User;
  };
}

export interface EditCardData {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    profileImage?: string;
  } | null;
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Низький', color: '#4caf50' },
  { value: 'MEDIUM', label: 'Середній', color: '#ff9800' },
  { value: 'HIGH', label: 'Високий', color: '#f44336' },
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'color', 'background',
  'blockquote', 'code-block',
  'link',
];

interface EditCardDialogProps {
  open: boolean;
  onClose: () => void;
  card: EditCardData | null;
  onCardUpdated?: () => void;
}

export default function EditCardDialog({
  open,
  onClose,
  card,
  onCardUpdated,
}: EditCardDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [assignee, setAssignee] = useState<User | null>(null);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const { data: usersData, loading: usersLoading } = useQuery<GetUsersData>(GET_USERS_QUERY, {
    skip: !open,
  });

  const [updateCard, { loading }] = useMutation<UpdateCardData>(UPDATE_CARD_MUTATION);

  const users: User[] = usersData?.users ?? [];

  // Populate form when card changes
  useEffect(() => {
    if (card && open) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setPriority(card.priority || 'LOW');

      // Format dueDate for input[type="date"]
      if (card.dueDate) {
        const d = new Date(card.dueDate);
        const formatted = d.toISOString().split('T')[0];
        setDueDate(formatted);
      } else {
        setDueDate('');
      }

      // Set assignee from card user
      if (card.user) {
        setAssignee({ id: card.user.id, name: card.user.name, email: card.user.email || '' });
      } else {
        setAssignee(null);
      }

      setErrors({});
    }
  }, [card, open]);

  // Update assignee once users are loaded if card has userId but no user object
  useEffect(() => {
    if (card?.userId && !card.user && users.length > 0) {
      const found = users.find((u) => u.id === card.userId);
      if (found) setAssignee(found);
    }
  }, [users, card]);

  const handleClose = () => {
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

    if (!card || !validateForm()) {
      return;
    }

    try {
      const cleanDescription = description.replace(/<(.|\n)*?>/g, '').trim()
        ? description.trim()
        : undefined;

      await updateCard({
        variables: {
          id: card.id,
          data: {
            title: title.trim(),
            description: cleanDescription,
            dueDate: dueDate || null,
            priority,
            userId: assignee?.id || null,
          },
        },
      });

      onCardUpdated?.();
      handleClose();
    } catch (err) {
      console.error('Error updating card:', err);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box component="span" sx={{ display: 'block', fontSize: '1.25rem', fontWeight: 600 }}>
            Редагувати картку
          </Box>
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

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Опис (опціонально)
            </Typography>
            <Box
              sx={{
                '& .ql-container': {
                  minHeight: 120,
                  fontSize: '0.95rem',
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                },
                '& .ql-toolbar': {
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                },
                '& .ql-editor': {
                  minHeight: 120,
                },
              }}
            >
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Додайте детальний опис..."
                readOnly={loading}
              />
            </Box>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel id="priority-label">Пріоритет</InputLabel>
            <Select
              labelId="priority-label"
              value={priority}
              label="Пріоритет"
              onChange={(e) => setPriority(e.target.value as string)}
              disabled={loading}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: option.color,
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete<User>
            options={users}
            value={assignee}
            onChange={(_, newValue) => setAssignee(newValue)}
            getOptionLabel={(option) => option.name || option.email}
            loading={usersLoading}
            disabled={loading}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              const filter = inputValue.toLowerCase();
              return options.filter(
                (user) =>
                  (user.name || '').toLowerCase().includes(filter) ||
                  user.email.toLowerCase().includes(filter),
              );
            }}
            renderOption={({ key, ...props }, option) => (
              <li key={option.id} {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {(option.name || option.email).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name || '(без імені)'}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Виконавець (опціонально)"
                placeholder="Почніть вводити ім'я..."
                margin="normal"
              />
            )}
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
            {loading ? 'Збереження...' : 'Зберегти зміни'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

