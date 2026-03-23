import { useState, useMemo } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Close, Task, RocketLaunch } from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';
import { QUILL_MODULES, QUILL_FORMATS } from '../helpers/utils/textEditorHelper.ts';
import {GET_USERS_QUERY, CREATE_CARD_MUTATION, GET_BOARD_CARDS_FOR_CREATE} from "../helpers/gql/cardGQL.ts";
import {PRIORITY_OPTIONS} from "../helpers/utils/color.ts";




interface User {
  id: string;
  name: string;
  email: string;
}

interface ParentCardOption {
  id: string;
  title: string;
  suffix?: string;
  listTitle?: string;
}

interface GetUsersData {
  users: User[];
}

interface CreateCardData {
  createCard: {
    id: string;
    title: string;
    description: string;
    position: number;
    dueDate: string;
    priority: string;
    suffix: string;
    userId: string;
    user: User;
  };
}


interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  boardId?: string;
  onCardCreated: () => void;
}

export default function CreateCardDialog({
  open,
  onClose,
  listId,
  listTitle,
  boardId,
  onCardCreated,
}: CreateCardDialogProps) {
  const [title, setTitle] = useState('');
  const { t } = useTranslation();  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [assignee, setAssignee] = useState<User | null>(null);
  const [parentTask, setParentTask] = useState<ParentCardOption | null>(null);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [cardType, setCardType] = useState<'TASK' | 'RELEASE'>('TASK');
  const [selectedReleaseTaskIds, setSelectedReleaseTaskIds] = useState<string[]>([]);

  const { data: usersData, loading: usersLoading } = useQuery<GetUsersData>(GET_USERS_QUERY, {
    skip: !open,
  });

  const { data: boardData } = useQuery(GET_BOARD_CARDS_FOR_CREATE, {
    variables: { boardId },
    skip: !open || !boardId,
  });

  const [createCard, { loading }] = useMutation<CreateCardData>(CREATE_CARD_MUTATION);

  const users: User[] = usersData?.users ?? [];

  const parentCardOptions: ParentCardOption[] = useMemo(() => {
    if (!boardData?.board?.lists) return [];
    const options: ParentCardOption[] = [];
    for (const list of boardData.board.lists) {
      for (const c of list.cards) {
        options.push({
          id: c.id,
          title: c.title,
          suffix: c.suffix,
          listTitle: list.title,
        });
      }
    }
    return options;
  }, [boardData]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('LOW');
    setAssignee(null);
    setParentTask(null);
    setErrors({});
    setCardType('TASK');
    setSelectedReleaseTaskIds([]);
    onClose();
  };

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = t('validation.cardTitleRequired');
    } else if (title.trim().length < 2) {
      newErrors.title = t('validation.cardTitleMin');
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
      const cleanDescription = description.replace(/<(.|\n)*?>/g, '').trim()
        ? description.trim()
        : undefined;

      const result = await createCard({
        variables: {
          title: title.trim(),
          description: cleanDescription,
          listId,
          dueDate: dueDate || undefined,
          priority,
          userId: assignee?.id || undefined,
          parentId: parentTask?.id || undefined,
          type: cardType,
          releaseTaskIds: cardType === 'RELEASE' && selectedReleaseTaskIds.length > 0
            ? selectedReleaseTaskIds
            : undefined,
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
            {t('createCard.title')}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t('createCard.inList', { listTitle })}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Card Type Toggle */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('createCard.cardType')}
            </Typography>
            <ToggleButtonGroup
              value={cardType}
              exclusive
              onChange={(_, val) => val && setCardType(val)}
              size="small"
              fullWidth
              disabled={loading}
            >
              <ToggleButton value="TASK" sx={{ textTransform: 'none', gap: 0.5 }}>
                <Task fontSize="small" /> {t('cardType.task')}
              </ToggleButton>
              <ToggleButton value="RELEASE" sx={{ textTransform: 'none', gap: 0.5 }}>
                <RocketLaunch fontSize="small" /> {t('cardType.release')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

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
                modules={QUILL_MODULES()}
                formats={QUILL_FORMATS()}
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
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option[0]} value={option[0]}>
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
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {(option.name || option.email).charAt(0).toUpperCase()}
                  </Avatar>
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

          {/* Release tasks selector — shown only for RELEASE type */}
          {cardType === 'RELEASE' && boardId && parentCardOptions.length > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('release.selectTasks')}
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  maxHeight: 220,
                  overflow: 'auto',
                }}
              >
                <List dense disablePadding>
                  {parentCardOptions.map((card) => {
                    const isSelected = selectedReleaseTaskIds.includes(card.id);
                    return (
                      <ListItem key={card.id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            setSelectedReleaseTaskIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== card.id)
                                : [...prev, card.id],
                            );
                          }}
                          dense
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox
                              edge="start"
                              checked={isSelected}
                              tabIndex={-1}
                              disableRipple
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {card.suffix && (
                                  <Chip label={card.suffix} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                )}
                                <Typography variant="body2" noWrap>{card.title}</Typography>
                              </Box>
                            }
                            secondary={card.listTitle}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
              {selectedReleaseTaskIds.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {t('release.selectedCount', { count: selectedReleaseTaskIds.length })}
                </Typography>
              )}
            </Box>
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
            {loading ? t('common.creating') : t('createCard.createButton')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

