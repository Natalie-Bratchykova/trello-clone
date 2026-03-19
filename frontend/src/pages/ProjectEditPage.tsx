import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  DragIndicator,
  Delete,
  Add,
  Edit,
  Check,
  Close,
} from '@mui/icons-material';

// ─── GraphQL ───────────────────────────────────────────────

const GET_BOARD_FOR_EDIT = gql`
  query GetBoardForEdit($id: ID!) {
    board(id: $id) {
      id
      title
      color
      boardIdentifier
      createdAt
      updatedAt
      lists {
        id
        title
        position
      }
    }
  }
`;

const UPDATE_BOARD_MUTATION = gql`
  mutation UpdateBoard($id: ID!, $data: UpdateBoardInput!) {
    updateBoard(id: $id, data: $data) {
      id
      title
      color
      boardIdentifier
      updatedAt
    }
  }
`;

const UPDATE_LIST_MUTATION = gql`
  mutation UpdateList($id: ID!, $data: UpdateListInput!) {
    updateList(id: $id, data: $data) {
      id
      title
      position
    }
  }
`;

const DELETE_LIST_MUTATION = gql`
  mutation DeleteList($id: ID!) {
    deleteList(id: $id)
  }
`;

const CREATE_LIST_MUTATION = gql`
  mutation CreateListInEdit($title: String!, $boardId: ID!) {
    createList(data: { title: $title, boardId: $boardId }) {
      id
      title
      position
    }
  }
`;

const MOVE_LIST_MUTATION = gql`
  mutation MoveList($data: MoveListInput!) {
    moveList(data: $data) {
      id
      title
      position
    }
  }
`;

// ─── Types ─────────────────────────────────────────────────

interface ListItem {
  id: string;
  title: string;
  position: number;
}

interface BoardData {
  board: {
    id: string;
    title: string;
    color: string;
    boardIdentifier?: string;
    createdAt: string;
    updatedAt: string;
    lists: ListItem[];
  };
}

// ─── Preset colors ─────────────────────────────────────────

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

// ─── Component ─────────────────────────────────────────────

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0079bf');
  const [boardIdentifier, setBoardIdentifier] = useState('');
  const [lists, setLists] = useState<ListItem[]>([]);
  const [originalLists, setOriginalLists] = useState<ListItem[]>([]);
  const [errors, setErrors] = useState<{ title?: string; boardIdentifier?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // List editing
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ─── Queries / Mutations ──────────────────────────────────

  const { loading, error, data, refetch } = useQuery<BoardData>(GET_BOARD_FOR_EDIT, {
    variables: { id },
    skip: !id,
  });

  const [updateBoard, { loading: savingBoard }] = useMutation(UPDATE_BOARD_MUTATION);
  const [updateList] = useMutation(UPDATE_LIST_MUTATION);
  const [deleteList] = useMutation(DELETE_LIST_MUTATION);
  const [createList, { loading: creatingList }] = useMutation(CREATE_LIST_MUTATION);
  const [moveList] = useMutation(MOVE_LIST_MUTATION);

  // ─── Populate form from fetched data ──────────────────────

  useEffect(() => {
    if (data?.board) {
      setTitle(data.board.title);
      setColor(data.board.color);
      setBoardIdentifier(data.board.boardIdentifier || '');
      const sorted = [...data.board.lists].sort((a, b) => a.position - b.position);
      setLists(sorted);
      setOriginalLists(sorted);
      setHasChanges(false);
    }
  }, [data]);

  // ─── Validation ───────────────────────────────────────────

  const validate = useCallback(() => {
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
        newErrors.boardIdentifier = 'Тільки літери, цифри та дефіс';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, boardIdentifier]);

  // ─── Save board info ─────────────────────────────────────

  const handleSaveBoard = async () => {
    if (!validate()) return;

    try {
      // Save board info
      await updateBoard({
        variables: {
          id,
          data: {
            title: title.trim(),
            color,
            boardIdentifier: boardIdentifier.trim() || null,
          },
        },
      });

      // Save any reordered lists
      const reorderPromises = lists
        .filter((list) => {
          const original = originalLists.find((o) => o.id === list.id);
          return original && original.position !== list.position;
        })
        .map((list) =>
          moveList({
            variables: {
              data: { listId: list.id, position: list.position },
            },
          }),
        );

      if (reorderPromises.length > 0) {
        await Promise.all(reorderPromises);
      }

      await refetch();
      setSnackbar({ open: true, message: 'Проект оновлено!', severity: 'success' });
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Помилка збереження', severity: 'error' });
    }
  };

  // ─── List CRUD ────────────────────────────────────────────

  const handleAddList = async () => {
    if (!newListTitle.trim() || !id) return;

    try {
      await createList({
        variables: { title: newListTitle.trim(), boardId: id },
      });
      setNewListTitle('');
      setIsAddingList(false);
      await refetch();
      setSnackbar({ open: true, message: 'Колонку додано', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Помилка додавання колонки', severity: 'error' });
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!editingListTitle.trim()) return;

    try {
      await updateList({
        variables: { id: listId, data: { title: editingListTitle.trim() } },
      });
      setEditingListId(null);
      setEditingListTitle('');
      await refetch();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Помилка перейменування', severity: 'error' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList({ variables: { id: listId } });
      await refetch();
      setSnackbar({ open: true, message: 'Колонку видалено', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Помилка видалення', severity: 'error' });
    }
  };

  // ─── Drag & Drop for list reordering ─────────────────────

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...lists];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);

    // Update local state only — positions will be persisted on Save
    const updatedLists = reordered.map((l, i) => ({ ...l, position: i }));
    setLists(updatedLists);
    setHasChanges(true);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ─── Loading / Error states ───────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.board) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error ? `Помилка: ${error.message}` : 'Проект не знайдено'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Повернутись до проектів
        </Button>
      </Container>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 6 }}>
      {/* Header */}
      <Box sx={{ backgroundColor: color, color: 'white', py: 2, px: 3, mb: 4 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/board/${id}`)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Налаштування проекту
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {title || 'Без назви'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveBoard}
              disabled={savingBoard || !hasChanges}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                textTransform: 'none',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {savingBoard ? 'Збереження...' : 'Зберегти'}
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md">
        {/* ── Section: Basic Info ── */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Основна інформація
          </Typography>

          <TextField
            fullWidth
            label="Назва проекту"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            fullWidth
            label="Ідентифікатор проекту"
            placeholder="Наприклад: PROJ або MY-APP"
            value={boardIdentifier}
            onChange={(e) => { setBoardIdentifier(e.target.value.toUpperCase()); setHasChanges(true); }}
            error={!!errors.boardIdentifier}
            helperText={
              errors.boardIdentifier ||
              'Необов\'язково. 2-10 символів (літери, цифри, дефіс). Використовується як префікс для карток.'
            }
            margin="normal"
            inputProps={{ maxLength: 10 }}
          />
        </Paper>

        {/* ── Section: Color ── */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Колір проекту
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1.5,
              maxWidth: 320,
            }}
          >
            {PRESET_COLORS.map((c) => (
              <Tooltip key={c.value} title={c.name}>
                <Box
                  onClick={() => { setColor(c.value); setHasChanges(true); }}
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: c.value,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: color === c.value ? '3px solid' : '2px solid transparent',
                    borderColor: color === c.value ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': { transform: 'scale(1.1)', boxShadow: 2 },
                  }}
                >
                  {color === c.value && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Preview */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderTop: `4px solid ${color}`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title || 'Назва проекту'}
            </Typography>
            {boardIdentifier && (
              <Typography variant="body2" color="text.secondary">
                Ідентифікатор: <strong>{boardIdentifier}</strong>
              </Typography>
            )}
          </Box>
        </Paper>

        {/* ── Section: Columns ── */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Колонки ({lists.length})
            </Typography>
            {!isAddingList && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setIsAddingList(true)}
                sx={{ textTransform: 'none' }}
              >
                Додати колонку
              </Button>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Перетягуйте колонки за іконку ☰ для зміни порядку
          </Typography>

          {lists.length === 0 && !isAddingList && (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Немає колонок
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setIsAddingList(true)}
              >
                Додати першу колонку
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {lists.map((list, index) => (
              <Box
                key={list.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: dragOverIndex === index ? 'primary.main' : 'divider',
                  backgroundColor:
                    draggedIndex === index
                      ? 'action.disabledBackground'
                      : dragOverIndex === index
                        ? 'primary.50'
                        : 'background.paper',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  cursor: 'grab',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                {/* Drag handle */}
                <DragIndicator sx={{ color: 'text.disabled', cursor: 'grab', flexShrink: 0 }} />

                {/* Position badge */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>

                {/* Title / Edit */}
                {editingListId === list.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                    <TextField
                      size="small"
                      value={editingListTitle}
                      onChange={(e) => setEditingListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameList(list.id);
                        if (e.key === 'Escape') { setEditingListId(null); setEditingListTitle(''); }
                      }}
                      autoFocus
                      fullWidth
                      sx={{ '& .MuiInputBase-input': { py: 0.75 } }}
                    />
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleRenameList(list.id)}
                    >
                      <Check fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => { setEditingListId(null); setEditingListTitle(''); }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
                    {list.title}
                  </Typography>
                )}

                {/* Action buttons */}
                {editingListId !== list.id && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Перейменувати">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingListId(list.id);
                          setEditingListTitle(list.title);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            ))}

            {/* Add new column */}
            {isAddingList && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                }}
              >
                <Add sx={{ color: 'primary.main', flexShrink: 0 }} />
                <TextField
                  size="small"
                  placeholder="Назва нової колонки..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') { setIsAddingList(false); setNewListTitle(''); }
                  }}
                  autoFocus
                  fullWidth
                  disabled={creatingList}
                  sx={{ '& .MuiInputBase-input': { py: 0.75 } }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddList}
                  disabled={creatingList || !newListTitle.trim()}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Додати
                </Button>
                <IconButton
                  size="small"
                  onClick={() => { setIsAddingList(false); setNewListTitle(''); }}
                  disabled={creatingList}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/board/${id}`)}
            sx={{ textTransform: 'none' }}
          >
            Повернутись до дошки
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveBoard}
            disabled={savingBoard || !hasChanges}
            sx={{ textTransform: 'none' }}
          >
            {savingBoard ? 'Збереження...' : 'Зберегти зміни'}
          </Button>
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

