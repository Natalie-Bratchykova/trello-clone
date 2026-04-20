import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Fab,
  Snackbar,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import BoardCard from '../components/BoardCard';
import ProjectsSkeleton from '../components/ProjectsSkeleton';
import EmptyState from '../components/EmptyState';
import CreateBoardDialog from '../components/CreateBoardDialog';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';

import { GET_ALL_BOARDS, DELETE_BOARD_MUTATION } from '../helpers/gql/boardGQL.ts';
import { useUserContext } from '../context/UserContext';

interface Board {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  listsCount?: number;
  cardsCount?: number;
}

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useUserContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    open: boolean;
    boardId: string | null;
    boardTitle: string;
  }>({
    open: false,
    boardId: null,
    boardTitle: '',
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { loading, error, data } = useQuery<{ boards: Board[] }>(GET_ALL_BOARDS, {
    skip: !isAuthenticated,
  });

  const boards = data?.boards ?? [];

  const [deleteBoard, { loading: deleteLoading }] = useMutation(DELETE_BOARD_MUTATION, {
    refetchQueries: [{ query: GET_ALL_BOARDS }],
    onCompleted: () => {
      setSnackbar({
        open: true,
        message: t('projects.deleteSuccess'),
        severity: 'success',
      });
      setDeleteDialogState({ open: false, boardId: null, boardTitle: '' });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: t('projects.deleteError', { message: error.message }),
        severity: 'error',
      });
    },
  });

  const handleDeleteBoard = (id: string) => {
    const board = boards.find(b => b.id === id);
    if (board) {
      setDeleteDialogState({
        open: true,
        boardId: id,
        boardTitle: board.title,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.boardId) return;

    try {
      await deleteBoard({
        variables: { id: deleteDialogState.boardId },
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCreateBoard = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBoardCreated = () => {
    setSnackbar({
      open: true,
      message: t('projects.createSuccess'),
      severity: 'success',
    });
  };

  if (!isAuthenticated) {
    return <EmptyState />;
  }

  if (loading) {
    return <ProjectsSkeleton />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t('projects.loadError', { message: error.message })}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('projects.myProjects')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {boards.length === 0
              ? t('projects.noProjectsYet')
              : t('projects.totalProjects', { count: boards.length })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateBoard}
          size="large"
        >
          {t('projects.createProject')}
        </Button>
      </Box>
      {boards.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.default',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('projects.noProjects')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('projects.startCreating')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleCreateBoard}
          >
            {t('projects.createProject')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} onDelete={handleDeleteBoard}  />
          ))}
        </Box>
      )}

      {boards.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
          }}
          onClick={handleCreateBoard}
        >
          <Add />
        </Fab>
      )}

      <CreateBoardDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        userId={user?.id}
        onBoardCreated={handleBoardCreated}
      />

      <ConfirmDeleteDialog
        open={deleteDialogState.open}
        onClose={() => setDeleteDialogState({ open: false, boardId: null, boardTitle: '' })}
        onConfirm={handleConfirmDelete}
        boardTitle={deleteDialogState.boardTitle}
        loading={deleteLoading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
    </Container>
  );
}
