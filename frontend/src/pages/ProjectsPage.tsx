import {useState, useEffect} from 'react';
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
import BoardCard from '../components/BoardCard';
import ProjectsSkeleton from '../components/ProjectsSkeleton';
import EmptyState from '../components/EmptyState';
import CreateBoardDialog from '../components/CreateBoardDialog';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';

import {GET_USER_BOARDS, DELETE_BOARD_MUTATION} from "../helpers/gql/boardGQL.ts";



interface Board {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  listsCount?: number;
  cardsCount?: number;
}

interface ProjectsPageProps {
  isAuthenticated: boolean;
  userId?: string;
  onLogin: () => void; // Залишаємо для сумісності, але не використовуємо
}

export default function ProjectsPage({ isAuthenticated, userId }: ProjectsPageProps) {
  const [boards, setBoards] = useState<Board[]>([]);
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

  const { loading, error, data, refetch } = useQuery<{ userBoards: Board[] }, { userId: string }>(GET_USER_BOARDS, {
    variables: { userId: userId || '' },
    skip: !isAuthenticated || !userId,
  });

  const [deleteBoard, { loading: deleteLoading }] = useMutation(DELETE_BOARD_MUTATION, {
    onCompleted: () => {
      setSnackbar({
        open: true,
        message: 'Проект успішно видалено',
        severity: 'success',
      });
      setDeleteDialogState({ open: false, boardId: null, boardTitle: '' });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Помилка видалення: ${error.message}`,
        severity: 'error',
      });
    },
  });



  useEffect(() => {
    if (data?.userBoards) {
      setBoards(data.userBoards);
    }
  }, [data]);

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
      setBoards(boards.filter(board => board.id !== deleteDialogState.boardId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCreateBoard = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBoardCreated = (newBoard: Board) => {
    setBoards([newBoard, ...boards]);
    setSnackbar({
      open: true,
      message: 'Проект успішно створено!',
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
          Помилка завантаження проектів: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Мої проекти
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {boards.length === 0
              ? 'У вас поки немає проектів. Створіть свій перший проект!'
              : `Всього проектів: ${boards.length}`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateBoard}
          size="large"
        >
          Створити проект
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
            Немає проектів
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Почніть з створення вашого першого проекту
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleCreateBoard}
          >
            Створити проект
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

      {userId && (
        <CreateBoardDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          userId={userId}
          onBoardCreated={handleBoardCreated}
        />
      )}

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

