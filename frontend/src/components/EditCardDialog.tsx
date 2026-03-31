import { useState, useEffect, useMemo } from 'react';
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
  Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';
import {GET_USERS_EDIT_QUERY, GET_BOARD_CARDS_QUERY, UPDATE_CARD_MUTATION} from "../helpers/gql/cardGQL.ts";
import {PRIORITY_OPTIONS} from "../helpers/utils/color.ts";
import {QUILL_MODULES, QUILL_FORMATS} from "../helpers/utils/textEditorHelper.ts";
import type {User, ParentCardOption, EditCardDialogProps, EditCardData, UpdateCardData, GetUsersData} from '../helpers/types/cardType.ts'


export default function EditCardDialog({
  open,
  onClose,
  card,
  boardId,
  onCardUpdated,
}: EditCardDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [assignee, setAssignee] = useState<User | null>(null);
  const [parentTask, setParentTask] = useState<ParentCardOption | null>(null);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { t } = useTranslation();
  const { data: usersData, loading: usersLoading } = useQuery<GetUsersData>(GET_USERS_EDIT_QUERY, {
    skip: !open,
  });

  const { data: boardData } = useQuery(GET_BOARD_CARDS_QUERY, {
    variables: { boardId },
    skip: !open || !boardId,
  });

  const [updateCard, { loading }] = useMutation<UpdateCardData>(UPDATE_CARD_MUTATION);

  const users: User[] = usersData?.users ?? [];

  // Flatten all board cards into options for the parent selector (exclude current card)
  const parentCardOptions: ParentCardOption[] = useMemo(() => {
    if (!boardData?.board?.lists) return [];
    const options: ParentCardOption[] = [];
    for (const list of boardData.board.lists) {
      for (const c of list.cards) {
        if (card && c.id === card.id) continue; // exclude self
        options.push({
          id: c.id,
          title: c.title,
          suffix: c.suffix,
          listTitle: list.title,
        });
      }
    }
    return options;
  }, [boardData, card]);

  // Populate form when card changes
  useEffect(() => {
    if (card && open) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setPriority(card.priority || 'LOW');

      if (card.dueDate) {
        const d = new Date(card.dueDate);
        const formatted = d.toISOString().split('T')[0];
        setDueDate(formatted);
      } else {
        setDueDate('');
      }

      if (card.user) {
        setAssignee({ id: card.user.id, name: card.user.name, email: card.user.email || '' });
      } else {
        setAssignee(null);
      }

      setErrors({});
    }
  }, [card, open]);

  // Set parent task once board cards are loaded
  useEffect(() => {
    if (card?.parentId && parentCardOptions.length > 0) {
      const found = parentCardOptions.find((o) => o.id === card.parentId);
      setParentTask(found || null);
    } else if (card && !card.parentId) {
      setParentTask(null);
    }
  }, [card, parentCardOptions]);

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
            parentId: parentTask?.id || null,
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
            {t('editCard.title')}
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
            label={t('createCard.cardName')}
            placeholder={t('createCard.cardNamePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            disabled={loading}
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('createCard.descriptionOptional')}
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
                modules={QUILL_MODULES(false)}
                formats={QUILL_FORMATS(false)}
                placeholder={t('createCard.descriptionPlaceholder')}
                readOnly={loading}
              />
            </Box>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel id="priority-label">{t('priority.label')}</InputLabel>
            <Select
              labelId="priority-label"
              value={priority}
              label={t('priority.label')}
              onChange={(e) => setPriority(e.target.value as string)}
              disabled={loading}
            >
              {PRIORITY_OPTIONS.map(( option) => (
                <MenuItem key={option[1].labelKey} value={option[0]}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: option[1].color,
                      }}
                    />
                    {t(option[1].labelKey)}
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
                  {option.profileImage ?
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }} src={option.profileImage? `http://localhost:3000${option.profileImage}`: undefined}/> :
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {(option.name || option.email).charAt(0).toUpperCase()}
                      </Avatar>
                  }
                  <Box>
                    <Typography variant="body2">{option.name || t('common.noName')}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('assignee.label')}
                placeholder={t('assignee.placeholder')}
                margin="normal"
              />
            )}
          />

          {/* Parent task selector */}
          {boardId && (
            <Autocomplete<ParentCardOption>
              options={parentCardOptions}
              value={parentTask}
              onChange={(_, newValue) => setParentTask(newValue)}
              getOptionLabel={(option) =>
                option.suffix ? `${option.suffix} — ${option.title}` : option.title
              }
              disabled={loading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              groupBy={(option) => option.listTitle || ''}
              filterOptions={(options, { inputValue }) => {
                const filter = inputValue.toLowerCase();
                return options.filter(
                  (o) =>
                    o.title.toLowerCase().includes(filter) ||
                    (o.suffix || '').toLowerCase().includes(filter),
                );
              }}
              renderOption={({ key, ...props }, option) => (
                <li key={option.id} {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    {option.suffix && (
                      <Chip label={option.suffix} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                    )}
                    <Typography variant="body2" noWrap>{option.title}</Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('parentTask.label')}
                  placeholder={t('parentTask.placeholder')}
                  margin="normal"
                />
              )}
            />
          )}

          <TextField
            fullWidth
            label={t('dueDate.label')}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t('common.saving') : t('editCard.saveChanges')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
