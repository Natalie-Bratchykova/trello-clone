import { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { ArrowBack, CalendarToday, Person, Flag, AccessTime, List as ListIcon, Dashboard, Edit, Delete, Warning, PersonAdd } from '@mui/icons-material';
import CommentsSection from "../components/CommentsSection.tsx";
import EditCardDialog from "../components/EditCardDialog.tsx";

const GET_CARD = gql`
  query GetCard($id: ID!) {
    card(id: $id) {
      id
      title
      description
      suffix
      priority
      position
      dueDate
      createdAt
      updatedAt
      listId
      userId
      parentId
      list {
        id
        title
        board {
          id
          title
          color
        }
      }
      user {
        id
        name
        email
        profileImage
      }
      parent {
        id
        title
        suffix
      }
      children {
        id
        title
        suffix
        priority
        dueDate
        user {
          id
          name
        }
      }
    }
  }
`;

const GET_BOARD_LISTS = gql`
  query GetBoardListsForTask($boardId: ID!) {
    boardLists(boardId: $boardId) {
      id
      title
      position
    }
  }
`;

const UPDATE_CARD_LIST = gql`
  mutation UpdateCardList($id: ID!, $data: UpdateCardInput!) {
    updateCard(id: $id, data: $data) {
      id
      listId
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

const DELETE_CARD_MUTATION = gql`
  mutation DeleteCardFromTask($id: ID!) {
    deleteCard(id: $id)
  }
`;

const ASSIGN_USER_MUTATION = gql`
  mutation AssignUserFromTask($cardId: ID!, $userId: ID) {
    assignUser(cardId: $cardId, userId: $userId) {
      id
      userId
      user {
        id
        name
        email
        profileImage
      }
    }
  }
`;

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LOW: { label: 'Низький', color: '#2e7d32', bg: '#e8f5e9', icon: '🟢' },
  MEDIUM: { label: 'Середній', color: '#e65100', bg: '#fff3e0', icon: '🟠' },
  HIGH: { label: 'Високий', color: '#c62828', bg: '#ffebee', icon: '🔴' },
};

function getDueDateColors(dueDate: string): { bg: string; color: string } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)   return { bg: '#d32f2f', color: '#fff' };
  if (diffDays < 5)   return { bg: '#ffebee', color: '#c62828' };
  if (diffDays < 14)  return { bg: '#fff3e0', color: '#e65100' };
  if (diffDays < 30)  return { bg: '#fff9c4', color: '#f57f17' };
  return { bg: '#e8f5e9', color: '#2e7d32' };
}

function getDueDateLabel(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Прострочено на ${Math.abs(diffDays)} дн.`;
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Завтра';
  if (diffDays < 7) return `Через ${diffDays} дн.`;
  if (diffDays < 30) return `Через ${Math.floor(diffDays / 7)} тижн.`;
  return `Через ${Math.floor(diffDays / 30)} міс.`;
}

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
  const client = useApolloClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { loading, error, data, refetch } = useQuery<CardData>(GET_CARD, {
    variables: { id },
    skip: !id,
  });

  const boardId = data?.card?.list?.board?.id;

  const { data: listsData } = useQuery(GET_BOARD_LISTS, {
    variables: { boardId },
    skip: !boardId,
  });

  const [updateCardList, { loading: updatingList }] = useMutation(UPDATE_CARD_LIST);
  const [deleteCard, { loading: deletingCard }] = useMutation(DELETE_CARD_MUTATION);
  const [assignUser, { loading: assigningUser }] = useMutation(ASSIGN_USER_MUTATION);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAssignedToMe = data?.card?.user?.id === currentUser?.id;

  const boardLists: { id: string; title: string; position: number }[] =
    listsData?.boardLists
      ? [...listsData.boardLists].sort((a: any, b: any) => a.position - b.position)
      : [];

  const handleAssignMe = async () => {
    if (!id || !currentUser?.id) return;
    try {
      const { data: assignData } = await assignUser({ variables: { cardId: id, userId: currentUser.id } });
      if (assignData?.assignUser) {
        // Update cache directly to avoid page blink
        client.cache.modify({
          id: client.cache.identify({ __typename: 'CardObject', id }),
          fields: {
            userId: () => assignData.assignUser.userId,
            user: () => {
              return assignData.assignUser.user;
            },
          },
        });
      }
    } catch (err) {
      console.error('Error assigning user:', err);
    }
  };

  const handleListChange = async (newListId: string) => {
    if (!id || newListId === data?.card?.listId) return;
    try {
      const { data: updateData } = await updateCardList({
        variables: { id, data: { listId: newListId } },
      });
      // Evict board-related data from cache so BoardPage refetches fresh data
      if (boardId) {
        client.cache.evict({ id: `BoardObject:${boardId}` });
        client.cache.evict({
          id: 'ROOT_QUERY',
          fieldName: 'board',
          args: { id: boardId },
        });
        client.cache.gc();
      }
      // Update card in cache directly — no refetch needed
      if (updateData?.updateCard) {
        client.cache.modify({
          id: client.cache.identify({ __typename: 'CardObject', id }),
          fields: {
            listId: () => updateData.updateCard.listId,
            list: () => updateData.updateCard.list,
          },
        });
      }
    } catch (err) {
      console.error('Error changing list:', err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCard({ variables: { id } });
      // Evict board from cache so BoardPage refreshes
      if (boardId) {
        client.cache.evict({ id: `BoardObject:${boardId}` });
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'board', args: { id: boardId } });
        client.cache.gc();
      }
      setDeleteConfirmOpen(false);
      // Navigate back to the board
      if (boardId) {
        navigate(`/board/${boardId}`);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Error deleting card:', err);
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
          {error ? `Помилка: ${error.message}` : 'Задачу не знайдено'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Повернутись назад
        </Button>
      </Container>
    );
  }

  const card = data.card;
  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;
  const boardColor = card.list?.board?.color || '#0079bf';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 4 }}>
      {/* Header */}
      <Box sx={{ backgroundColor: boardColor, color: 'white', py: 2, px: 3, mb: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              {card.suffix && (
                <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>
                  {card.suffix}
                </Typography>
              )}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {card.title}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditOpen(true)}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Редагувати
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#ef5350',
                  backgroundColor: 'rgba(239,83,80,0.15)',
                },
              }}
            >
              Видалити
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/projects" underline="hover" color="inherit">
            Проекти
          </Link>
          {card.list?.board && (
            <Link component={RouterLink} to={`/board/${card.list.board.id}`} underline="hover" color="inherit">
              {card.list.board.title}
            </Link>
          )}
          {card.list && (
            <Typography color="text.secondary">{card.list.title}</Typography>
          )}
          <Typography color="text.primary" fontWeight={600}>
            {card.suffix || card.title}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Description */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Опис
              </Typography>
              {card.description ? (
                <Box
                  sx={{
                    wordBreak:'break-word',
                    '& p': { m: 0, mb: 1 },
                    '& p:last-child': { mb: 0 },
                    '& ul, & ol': { pl: 3, m: 0, mb: 1, listStylePosition: 'outside' },
                    '& li': { wordBreak:'break-word' },
                    '& h1, & h2, & h3': { mt: 1, mb: 0.5 },
                    '& blockquote': {
                      borderLeft: '3px solid',
                      borderColor: 'divider',
                      pl: 2,
                      ml: 0,
                      color: 'text.secondary',
                    },
                    '& pre': {
                      backgroundColor: 'grey.900',
                      color: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      overflow: 'auto',
                    },
                    '& a': { color: 'primary.main' },
                    fontSize: '1rem',
                    lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{ __html: card.description }}
                />
              ) : (
                <Typography variant="body1" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  Опис відсутній
                </Typography>
              )}
            </Paper>

            {/* Parent task */}
            {card.parent && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Батьківська задача
                </Typography>
                <Box
                  component={RouterLink}
                  to={`/task/${card.parent.id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  {card.parent.suffix && (
                    <Chip label={card.parent.suffix} size="small" color="primary" variant="outlined" />
                  )}
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {card.parent.title}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Children subtasks */}
            {card.children && card.children.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Підзадачі ({card.children.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {card.children.map((child) => (
                    <Box
                      key={child.id}
                      component={RouterLink}
                      to={`/task/${child.id}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      {child.suffix && (
                        <Chip label={child.suffix} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {child.title}
                      </Typography>
                      {child.priority && (
                        <Chip
                          label={child.priority === 'HIGH' ? '🔴' : child.priority === 'MEDIUM' ? '🟠' : '🟢'}
                          size="small"
                          sx={{ minWidth: 0, flexShrink: 0 }}
                        />
                      )}
                      {child.user && (
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', flexShrink: 0 }}>
                          {child.user.name?.[0]?.toUpperCase()}
                        </Avatar>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Comments */}
            <Paper sx={{ p: 3 }}>
              <CommentsSection cardId={card.id} />
            </Paper>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <Paper sx={{ p: 3 }}>
              {/* Status / List */}
              {card.list && (
                <SidebarField icon={<ListIcon sx={{ fontSize: 18 }} />} label="Список">
                  {boardLists.length > 0 ? (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={card.listId}
                        onChange={(e) => handleListChange(e.target.value as string)}
                        disabled={updatingList}
                        variant="outlined"
                        sx={{
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': { py: 0.75, px: 1.5 },
                        }}
                      >
                        {boardLists.map((list) => (
                          <MenuItem key={list.id} value={list.id}>
                            {list.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip label={card.list.title} size="small" variant="outlined" />
                  )}
                </SidebarField>
              )}

              {/* Board */}
              {card.list?.board && (
                <SidebarField icon={<Dashboard sx={{ fontSize: 18 }} />} label="Проект">
                  <Chip
                    label={card.list.board.title}
                    size="small"
                    component={RouterLink}
                    to={`/board/${card.list.board.id}`}
                    clickable
                    sx={{ backgroundColor: card.list.board.color, color: 'white', fontWeight: 600 }}
                  />
                </SidebarField>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Priority */}
              {priorityConfig && (
                <SidebarField icon={<Flag sx={{ fontSize: 18 }} />} label="Пріоритет">
                  <Chip
                    label={`${priorityConfig.icon} ${priorityConfig.label}`}
                    size="small"
                    sx={{
                      backgroundColor: priorityConfig.bg,
                      color: priorityConfig.color,
                      fontWeight: 600,
                    }}
                  />
                </SidebarField>
              )}

              {/* Due Date */}
              {card.dueDate && (() => {
                const dueDateColors = getDueDateColors(card.dueDate!);
                return (
                  <SidebarField icon={<CalendarToday sx={{ fontSize: 18 }} />} label="Дедлайн">
                    <Box>
                      <Chip
                        label={new Date(card.dueDate!).toLocaleDateString('uk-UA', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        size="small"
                        sx={{
                          backgroundColor: dueDateColors.bg,
                          color: dueDateColors.color,
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {getDueDateLabel(card.dueDate!)}
                      </Typography>
                    </Box>
                  </SidebarField>
                );
              })()}

              {/* Assignee */}
              {card.user && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <SidebarField icon={<Person sx={{ fontSize: 18 }} />} label="Виконавець">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={card.user.profileImage ? `http://localhost:3000${card.user.profileImage}` : undefined}
                        sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main' }}
                      >
                        {!card.user.profileImage && card.user.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                          {card.user.name}
                        </Typography>
                        {card.user.email && (
                          <Typography variant="caption" color="text.secondary">
                            {card.user.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </SidebarField>
                </>
              )}

              {/* Assign to me button */}
              {!isAssignedToMe && currentUser?.id && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                  onClick={handleAssignMe}
                  disabled={assigningUser}
                  fullWidth
                  sx={{ textTransform: 'none', mb: 2 }}
                >
                  {assigningUser ? 'Призначення...' : 'Призначити на мене'}
                </Button>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Timestamps */}
              <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label="Створено">
                <Typography variant="body2" color="text.secondary">
                  {new Date(card.createdAt).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </SidebarField>
              <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label="Оновлено">
                <Typography variant="body2" color="text.secondary">
                  {new Date(card.updatedAt).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </SidebarField>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Видалити задачу?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви дійсно хочете видалити задачу <strong>"{card.title}"</strong>?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2">
              ⚠️ Це також видалить всі коментарі цієї задачі. Підзадачі будуть від'єднані. Цю дію не можна скасувати.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deletingCard}>
            Скасувати
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deletingCard}>
            {deletingCard ? 'Видалення...' : 'Так, видалити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SidebarField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

