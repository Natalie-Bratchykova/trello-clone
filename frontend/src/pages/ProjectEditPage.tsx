import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

import { CREATE_LIST_MUTATION, DELETE_LIST_MUTATION, UPDATE_LIST_MUTATION, MOVE_LIST_MUTATION } from '../helpers/gql/listGQL';
import { GET_BOARD_FOR_EDIT, UPDATE_BOARD_MUTATION } from '../helpers/gql/boardGQL';
import type { BoardData, ListItem } from '../helpers/types/listTypes.ts';
import { useListDragDrop } from '../hooks/useListDragDrop';
import ColorPicker from '../components/ColorPicker';
import BasicInfoSection from '../components/ProjectEdit/BasicInfoSection';
import ColumnsListSection from '../components/ProjectEdit/ColumnsListSection';

// ─── Component ─────────────────────────────────────────────

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form state
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0079bf');
  const [boardIdentifier, setBoardIdentifier] = useState('');
  const [lists, setLists] = useState<ListItem[]>([]);
  const [originalLists, setOriginalLists] = useState<ListItem[]>([]);
  const [errors, setErrors] = useState<{ title?: string; boardIdentifier?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

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

  // ─── Drag & Drop ──────────────────────────────────────────

  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragEnd } = useListDragDrop(lists, (reordered) => {
    setLists(reordered);
    setHasChanges(true);
  });

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
      newErrors.title = t('validation.titleRequired');
    } else if (title.trim().length < 3) {
      newErrors.title = t('validation.titleMin3');
    } else if (title.length > 50) {
      newErrors.title = t('validation.titleMax50');
    }

    if (boardIdentifier.trim()) {
      if (boardIdentifier.trim().length < 2) {
        newErrors.boardIdentifier = t('validation.identifierMin2');
      } else if (boardIdentifier.trim().length > 10) {
        newErrors.boardIdentifier = t('validation.identifierMax10');
      } else if (!/^[A-Za-z0-9-]+$/.test(boardIdentifier.trim())) {
        newErrors.boardIdentifier = t('validation.identifierFormatShort');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, boardIdentifier, t]);

  // ─── Save board info ─────────────────────────────────────

  const handleSaveBoard = async () => {
    if (!validate()) return;

    try {
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
      setSnackbar({ open: true, message: t('projectEdit.updateSuccess'), severity: 'success' });
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t('projectEdit.saveError'), severity: 'error' });
    }
  };

  // ─── List CRUD ────────────────────────────────────────────

  const handleAddList = async (listTitle: string) => {
    if (!id) return;
    try {
      await createList({ variables: { title: listTitle, boardId: id } });
      await refetch();
      setSnackbar({ open: true, message: t('projectEdit.columnAdded'), severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t('projectEdit.columnAddError'), severity: 'error' });
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    try {
      await updateList({ variables: { id: listId, data: { title: newTitle } } });
      await refetch();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t('projectEdit.renameError'), severity: 'error' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList({ variables: { id: listId } });
      await refetch();
      setSnackbar({ open: true, message: t('projectEdit.columnDeleted'), severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t('projectEdit.columnDeleteError'), severity: 'error' });
    }
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
          {error ? `${t('common.error')}: ${error.message}` : t('projectEdit.projectNotFound')}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          {t('projectEdit.backToProjectsList')}
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
                {t('projectEdit.settingsTitle')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {title || t('common.untitled')}
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
              {savingBoard ? t('common.saving') : t('common.save')}
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md">
        <BasicInfoSection
          title={title}
          setTitle={setTitle}
          boardIdentifier={boardIdentifier}
          setBoardIdentifier={setBoardIdentifier}
          errors={errors}
          setHasChanges={setHasChanges}
        />

        <ColorPicker
          color={color}
          setColor={setColor}
          setHasChanges={setHasChanges}
          title={title}
          boardIdentifier={boardIdentifier}
        />

        <ColumnsListSection
          lists={lists}
          color={color}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onRename={handleRenameList}
          onDelete={handleDeleteList}
          onAdd={handleAddList}
          isCreating={creatingList}
        />

        <Divider sx={{ my: 3 }} />

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(`/board/${id}`)} sx={{ textTransform: 'none' }}>
            {t('projectEdit.backToBoard')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveBoard}
            disabled={savingBoard || !hasChanges}
            sx={{ textTransform: 'none' }}
          >
            {savingBoard ? t('common.saving') : t('projectEdit.saveChanges')}
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

