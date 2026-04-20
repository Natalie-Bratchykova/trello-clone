import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Container, Box, Typography, CircularProgress, Alert, Button, Paper } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import EditCardDialog from '../components/EditCardDialog';
import DeleteCartDialog from '../components/Ticket/DeleteCartDialog';
import TaskHeader from '../components/TaskPage/TaskHeader';
import TaskBreadcrumbs from '../components/TaskPage/TaskBreadcrumbs';
import TaskMainContent from '../components/TaskPage/TaskMainContent';
import TaskSidebar from '../components/TaskPage/TaskSidebar';
import { PRIORITY_CONFIG } from '../helpers/utils/color';
import { GET_CARD } from '../helpers/gql/cardGQL';
import { useCardActions } from '../hooks/useCardActions';

interface CardData {
  card: {
    id: string;
    title: string;
    description?: string;
    suffix?: string;
    priority?: string;
    position: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    listId: string;
    userId?: string;
    parentId?: string;
    type?: string;
    releaseTasks?: any[];
    list?: {
      id: string;
      title: string;
      board?: {
        id: string;
        title: string;
        color: string;
      };
    };
    user?: {
      id: string;
      name: string;
      email?: string;
      profileImage?: string;
    };
    parent?: {
      id: string;
      title: string;
      suffix?: string;
    };
    children?: {
      id: string;
      title: string;
      suffix?: string;
      priority?: string;
      dueDate?: string;
      user?: {
        id: string;
        name: string;
      };
    }[];
  };
}

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { loading, error, data, refetch } = useQuery<CardData>(GET_CARD, {
    variables: { id },
    skip: !id,
  });

  const boardId = data?.card?.list?.board?.id;

  const {
    currentUser,
    boardLists,
    updatingList,
    deletingCard,
    assigningUser,
    handleAssignMe,
    handleListChange,
    handleDeleteCard,
  } = useCardActions(id, boardId);

  const isAssignedToMe = data?.card?.user?.id === currentUser?.id;

  const onListChange = async (newListId: string) => {
    if (!data?.card) return;
    await handleListChange(newListId, data.card.listId);
  };

  const onDelete = async () => {
    const success = await handleDeleteCard();
    if (success) {
      setDeleteConfirmOpen(false);
      if (boardId) {
        navigate(`/board/${boardId}`);
      } else {
        navigate(-1);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.card) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error ? `${t('common.error')}: ${error.message}` : t('task.taskNotFound')}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          {t('task.backToBoard')}
        </Button>
      </Container>
    );
  }

  const card = data.card;
  const displayReleaseTasks = card?.releaseTasks || [];
  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;
  const boardColor = card.list?.board?.color || '#0079bf';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 4 }}>
      {/* Header */}
      <TaskHeader
        card={card}
        boardColor={boardColor}
        onBack={() => navigate(-1)}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteConfirmOpen(true)}
        t={t}
      />

      <Container maxWidth="lg">
        <TaskBreadcrumbs card={card} t={t} />

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, pl: 1 }}>
          {card.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TaskMainContent card={card} displayReleaseTasks={displayReleaseTasks} t={t} />
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <Paper sx={{ p: 3 }}>
              <TaskSidebar
                card={card}
                boardLists={boardLists}
                priorityConfig={priorityConfig}
                isAssignedToMe={isAssignedToMe}
                currentUser={currentUser}
                updatingList={updatingList}
                assigningUser={assigningUser}
                onListChange={onListChange}
                onAssignMe={handleAssignMe}
                t={t}
                i18n={i18n}
              />
            </Paper>
          </Box>
        </Box>
      </Container>

      <EditCardDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        card={card ? {
          id: card.id,
          title: card.title,
          description: card.description,
          priority: card.priority,
          dueDate: card.dueDate,
          userId: card.userId || undefined,
          user: card.user || null,
          parentId: card.parentId,
        } : null}
        boardId={card?.list?.board?.id}
        onCardUpdated={() => {
          setEditOpen(false);
          refetch();
        }}
      />

      <DeleteCartDialog
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        handleDelete={onDelete}
        deleting={deletingCard}
        t={t}
        card={card}
      />
    </Box>
  );
}

