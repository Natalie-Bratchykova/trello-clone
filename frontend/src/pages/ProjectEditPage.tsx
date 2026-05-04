import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
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

import { GET_BOARD_FOR_EDIT } from '../helpers/gql/boardGQL';
import type { BoardData, ListItem } from '../helpers/types/listTypes.ts';
import { useListDragDrop } from '../hooks/useListDragDrop';
import { useProjectEdit } from '../hooks/useProjectEdit';
import ColorPicker from '../components/ColorPicker';
import BasicInfoSection from '../components/ProjectEdit/BasicInfoSection';
import ColumnsListSection from '../components/ProjectEdit/ColumnsListSection';


export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    saveBoardWithReorder,
    addList,
    renameList,
    deleteList,
    validation,
    snackbar,
    closeSnackbar,
    savingBoard,
    creatingList,
  } = useProjectEdit(id);

  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0079bf');
  const [boardIdentifier, setBoardIdentifier] = useState('');
  const [lists, setLists] = useState<ListItem[]>([]);
  const [originalLists, setOriginalLists] = useState<ListItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);


  const { loading, error, data, refetch } = useQuery<BoardData>(GET_BOARD_FOR_EDIT, {
    variables: { id },
    skip: !id,
  });



  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragEnd } = useListDragDrop(lists, (reordered) => {
    setLists(reordered);
    setHasChanges(true);
  });

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


  const handleSaveBoard = async () => {
    if (!id) return;

    const result = await saveBoardWithReorder({
      id,
      title,
      color,
      boardIdentifier,
      lists,
      originalLists,
    });

    if (result.success) {
      await refetch();
      setHasChanges(false);
    }
  };


  const handleAddList = async (listTitle: string) => {
    if (!id) return;
    const result = await addList(listTitle, id);
    if (result.success) {
      await refetch();
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    const result = await renameList(listId, newTitle);
    if (result.success) {
      await refetch();
    }
  };

  const handleDeleteList = async (listId: string) => {
    const result = await deleteList(listId);
    if (result.success) {
      await refetch();
    }
  };


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


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 6 }}>
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
          errors={validation.errors}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

