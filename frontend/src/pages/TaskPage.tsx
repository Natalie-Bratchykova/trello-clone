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
import { useTranslation } from 'react-i18next';
import {PRIORITY_CONFIG, getDueDateColors, getDueDateLabel, definePriorityLabel} from "../helpers/utils/color.ts";
import {formatDate} from "../helpers/utils/dateLocale.ts";
import {GET_CARD, GET_BOARD_LISTS, UPDATE_CARD_LIST, DELETE_CARD_MUTATION, ASSIGN_USER_MUTATION} from "../helpers/gql/cardGQL.ts";
import TextEditorUneditable from "../components/Ticket/TextEditorUneditable.tsx";




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
  const { t, i18n } = useTranslation();
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
      const result = updateData?.updateCard;
      if (result?.card) {
        const updatedCard = result.card;
        const movedReleaseTasks: { id: string; listId: string; position: number; list?: { id: string; title: string } }[] = result.movedReleaseTasks || [];

        client.cache.modify({
          id: client.cache.identify({ __typename: 'CardObject', id }),
          fields: {
            listId: () => updatedCard.listId,
            list: () => updatedCard.list,
          },
        });

        // Update cache for all moved release tasks
        for (const task of movedReleaseTasks) {
          client.cache.modify({
            id: client.cache.identify({ __typename: 'CardObject', id: task.id }),
            fields: {
              listId: () => task.listId,
              ...(task.list
                ? {
                    list: (_existing: any, { toReference }: any) => {
                      return toReference({ __typename: 'ListObject', id: task.listId }) || { __typename: 'ListObject', ...task.list };
                    },
                  }
                : {}),
            },
          });
        }
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
          {error ? `${t('common.error')}: ${error.message}` : t('task.taskNotFound')}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          {t('task.backToBoard')}
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
              {t('common.edit')}
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
              {t('common.delete')}
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/projects" underline="hover" color="inherit">
            {t('navbar.projects')}
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
                {t('ticketDetail.description')}
              </Typography>
              {card.description ? (
                <TextEditorUneditable html={card.description}/>
              ) : (
                <Typography variant="body1" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  {t('ticketDetail.noDescription')}
                </Typography>
              )}
            </Paper>

            {/* Parent task */}
            {card.parent && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {t('parentTask.title')}
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
                  {t('ticketDetail.subtasks', { count: card.children.length })}
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
                          label={definePriorityLabel(child.priority)}
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
              <CommentsSection cardId={card.id} cardDescription={card.description} />
            </Paper>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <Paper sx={{ p: 3 }}>
              {/* Status / List */}
              {card.list && (
                <SidebarField icon={<ListIcon sx={{ fontSize: 18 }} />} label={t('task.list')}>
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
                <SidebarField icon={<Dashboard sx={{ fontSize: 18 }} />} label={t('task.project')}>
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
                <SidebarField icon={<Flag sx={{ fontSize: 18 }} />} label={t('priority.label')}>
                  <Chip
                    label={`${priorityConfig.icon} ${t(priorityConfig.labelKey)}`}
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
                  <SidebarField icon={<CalendarToday sx={{ fontSize: 18 }} />} label={t('dueDate.deadline')}>
                    <Box>
                      <Chip
                        label={formatDate(i18n.language, card.dueDate, false)}
                        size="small"
                        sx={{
                          backgroundColor: dueDateColors.bg,
                          color: dueDateColors.color,
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {getDueDateLabel(card.dueDate!, t)}
                      </Typography>
                    </Box>
                  </SidebarField>
                );
              })()}

              {/* Assignee */}
              {card.user && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <SidebarField icon={<Person sx={{ fontSize: 18 }} />} label={t('filters.assignees')}>
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
                  {assigningUser ? t('assignee.assigning') : t('assignee.assignMe')}
                </Button>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Timestamps */}
              <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.createdAt')}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(i18n.language, card.createdAt)}
                </Typography>
              </SidebarField>
              <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.updatedAt')}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(i18n.language, card.updatedAt)}
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
          {t('deleteConfirm.deleteTask')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deleteConfirm.deleteTaskConfirm')} <strong>"{card.title}"</strong>?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2">
              {t('deleteConfirm.deleteTaskWarningFull')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deletingCard}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deletingCard}>
            {deletingCard ? t('common.deleting') : t('deleteConfirm.yesDelete')}
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

