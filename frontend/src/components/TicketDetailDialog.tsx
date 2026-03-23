import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Link,
  Button,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, CalendarToday, Person, Flag, AccessTime, Edit, AccountTree, Delete, Warning, PersonAdd, List as ListIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useMutation, useQuery, useApolloClient } from '@apollo/client/react';
import CommentsSection from './CommentsSection';
import EditCardDialog from './EditCardDialog';
import {PRIORITY_CONFIG, getDueDateColors, getDueDateLabel, definePriorityLabel} from "../helpers/color.ts";
import { useTranslation } from 'react-i18next';
import {DELETE_CARD_MUTATION, ASSIGN_USER_MUTATION, GET_BOARD_LISTS, UPDATE_CARD_LIST} from "../helpers/gql/cardGQL.ts";
import {formatDate} from "../helpers/dateLocale.ts";
import SubTask from "./Ticket/SubTask.tsx";
import DetailField from "./Ticket/DetailField.tsx";
import TextEditorUneditable from "./Ticket/TextEditorUneditable.tsx";
import DeleteCartDialog from "./Ticket/DeleteCartDialog.tsx";



export interface TicketDetailCard {
  id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  suffix?: string;
  priority?: string;
  type?: string;
  listId?: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
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
  releaseTasks?: {
    id: string;
    title: string;
    suffix?: string;
    priority?: string;
    listId?: string;
    user?: {
      id: string;
      name: string;
      profileImage?: string;
    };
    list?: {
      id: string;
      title: string;
    };
  }[];
}

interface TicketDetailDialogProps {
  open: boolean;
  onClose: () => void;
  card: TicketDetailCard | null;
  listTitle?: string;
  boardId?: string;
  onCardUpdated?: () => void;
  onCardDeleted?: () => void;
}

export default function TicketDetailDialog({ open, onClose, card, listTitle, boardId, onCardUpdated, onCardDeleted }: TicketDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [displayUser, setDisplayUser] = useState(card?.user || null);
  const [displayListId, setDisplayListId] = useState(card?.listId || '');
  const [displayListTitle, setDisplayListTitle] = useState(listTitle || '');
  const [displayReleaseTasks, setDisplayReleaseTasks] = useState(card?.releaseTasks || []);
  const client = useApolloClient();
  const { t, i18n } = useTranslation();

  const [deleteCard, { loading: deleting }] = useMutation(DELETE_CARD_MUTATION);
  const [assignUser, { loading: assigning }] = useMutation(ASSIGN_USER_MUTATION);
  const [updateCardList, { loading: updatingList }] = useMutation(UPDATE_CARD_LIST);

  const { data: listsData } = useQuery(GET_BOARD_LISTS, {
    variables: { boardId },
    skip: !boardId || !open,
  });

  const boardLists: { id: string; title: string; position: number }[] =
    listsData?.boardLists
      ? [...listsData.boardLists].sort((a: any, b: any) => a.position - b.position)
      : [];

  // Sync displayUser when card prop changes (e.g. dialog re-opened with different card)
  useEffect(() => {
    setDisplayUser(card?.user || null);
  }, [card?.user?.id, card?.id]);

  // Sync displayListId / displayListTitle when card or listTitle prop changes
  useEffect(() => {
    setDisplayListId(card?.listId || '');
    setDisplayListTitle(listTitle || '');
  }, [card?.listId, card?.id, listTitle]);

  // Sync displayReleaseTasks when card prop changes
  useEffect(() => {
    setDisplayReleaseTasks(card?.releaseTasks || []);
  }, [card?.id, card?.releaseTasks]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAssignedToMe = displayUser?.id === currentUser?.id;

  const handleListChange = async (newListId: string) => {
    if (!card || newListId === displayListId) return;
    try {
      const { data: updateData } = await updateCardList({
        variables: { id: card.id, data: { listId: newListId } },
      });
      const result = updateData?.updateCard;
      if (result?.card) {
        const updatedCard = result.card;
        const movedReleaseTasks: { id: string; listId: string; position: number; list?: { id: string; title: string } }[] = result.movedReleaseTasks || [];

        // Update local state immediately — no blink
        setDisplayListId(updatedCard.listId);
        setDisplayListTitle(updatedCard.list?.title || '');

        // Find target list title for cache updates
        const targetListObj = boardLists.find((l) => l.id === newListId);

        // Helper to move a card between lists in the cache
        const moveCardInCache = (cardId: string, oldListId: string | null, targetListId: string, listObj?: { id: string; title: string }) => {
          if (oldListId) {
            client.cache.modify({
              id: client.cache.identify({ __typename: 'ListObject', id: oldListId }),
              fields: {
                cards(existingCardRefs: any[] = [], { readField }) {
                  return existingCardRefs.filter((ref) => readField('id', ref) !== cardId);
                },
              },
            });
          }
          client.cache.modify({
            id: client.cache.identify({ __typename: 'ListObject', id: targetListId }),
            fields: {
              cards(existingCardRefs: any[] = [], { toReference, readField }) {
                const alreadyInList = existingCardRefs.some((ref) => readField('id', ref) === cardId);
                if (alreadyInList) return existingCardRefs;
                const cardRef = toReference({ __typename: 'CardObject', id: cardId });
                return [...existingCardRefs, cardRef];
              },
            },
          });
          // Update both listId and list object on the card
          const listData = listObj || (targetListObj ? { __typename: 'ListObject', id: targetListId, title: targetListObj.title } : undefined);
          client.cache.modify({
            id: client.cache.identify({ __typename: 'CardObject', id: cardId }),
            fields: {
              listId: () => targetListId,
              ...(listData
                ? {
                    list: (_existing: any, { toReference }: any) => {
                      return toReference({ __typename: 'ListObject', id: targetListId }) || listData;
                    },
                  }
                : {}),
            },
          });
        };

        // Move the main card
        moveCardInCache(card.id, displayListId, newListId, updatedCard.list);

        // Move all release-linked tasks and update their list info in cache
        for (const task of movedReleaseTasks) {
          const cachedTask = client.cache.readFragment<{ listId: string }>({
            id: client.cache.identify({ __typename: 'CardObject', id: task.id }),
            fragment: gql`fragment TaskListId on CardObject { listId }`,
          });
          const oldListId = cachedTask?.listId || null;
          if (oldListId !== task.listId) {
            moveCardInCache(task.id, oldListId, task.listId, task.list);
          }
        }

        // Update local displayReleaseTasks so the UI reflects new list titles immediately
        if (movedReleaseTasks.length > 0) {
          setDisplayReleaseTasks((prev) => {
            const movedMap = new Map(movedReleaseTasks.map((t) => [t.id, t]));
            return prev.map((rt) => {
              const moved = movedMap.get(rt.id);
              if (moved) {
                const newListTitle = moved.list?.title || boardLists.find((l) => l.id === moved.listId)?.title || rt.list?.title;
                return {
                  ...rt,
                  listId: moved.listId,
                  list: { id: moved.listId, title: newListTitle || '—' },
                };
              }
              return rt;
            });
          });
        }
      }
    } catch (err) {
      console.error('Error changing list:', err);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    try {
      await deleteCard({ variables: { id: card.id } });
      setDeleteConfirmOpen(false);
      onClose();
      onCardDeleted?.();
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const handleAssignMe = async () => {
    if (!card || !currentUser?.id) return;
    try {
      const { data: assignData } = await assignUser({ variables: { cardId: card.id, userId: currentUser.id } });
      if (assignData?.assignUser) {
        // Update local state immediately — no blink
        setDisplayUser(assignData.assignUser.user);
        // Also update Apollo cache for other components
        client.cache.modify({
          id: client.cache.identify({ __typename: 'CardObject', id: card.id }),
          fields: {
            userId: () => assignData.assignUser.userId,
            user: () => assignData.assignUser.user,
          },
        });
      }
    } catch (err) {
      console.error('Error assigning user:', err);
    }
  };

  if (!card) return null;

  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2, maxHeight: '90vh' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1, pr: 2 }}>
          {card.suffix && (
            <Link
              component={RouterLink}
              to={`/task/${card.id}`}
              underline="hover"
              sx={{ fontWeight: 600, mb: 0.5, display: 'block', fontSize: '0.75rem' }}
            >
              {card.suffix}
            </Link>
          )}
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {card.title}
          </Typography>
          {displayListTitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('ticketDetail.inList')} <strong>{displayListTitle}</strong>
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={() => setEditOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteConfirmOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {t('common.delete')}
          </Button>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Description */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              {t('ticketDetail.description')}
            </Typography>
            {card.description ? (
              <TextEditorUneditable html={card.description}/>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                {t('ticketDetail.noDescription')}
              </Typography>
            )}

            {/* Parent task */}
            {card.parent && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  {t('parentTask.title')}
                </Typography>
                <Link
                  component={RouterLink}
                  to={`/task/${card.parent.id}`}
                  underline="hover"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    textDecoration: 'none',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <AccountTree sx={{ fontSize: 16, color: 'text.secondary' }} />
                  {card.parent.suffix && (
                    <Chip label={card.parent.suffix} size="small" color="primary" variant="outlined" />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {card.parent.title}
                  </Typography>
                </Link>
              </Box>
            )}

            {/* Children subtasks */}
            {card.children && card.children.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  {t('ticketDetail.subtasks', { count: card.children.length })}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {card.children.map((child) => (
                   <SubTask child={child} key={child.id} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Release Tasks */}
            {card.type === 'RELEASE' && displayReleaseTasks && displayReleaseTasks.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                  🚀 {t('release.linkedTasks')} ({displayReleaseTasks.length})
                </Typography>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 120px 100px',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      bgcolor: 'action.hover',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('release.colId')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('release.colName')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('release.colStatus')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('release.colExecutor')}
                    </Typography>
                  </Box>
                  {/* Rows */}
                  {displayReleaseTasks.map((rt) => (
                    <Box
                      key={rt.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 120px 100px',
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                        alignItems: 'center',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Link
                        component={RouterLink}
                        to={`/task/${rt.id}`}
                        underline="hover"
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {rt.suffix || rt.id.slice(0, 8)}
                      </Link>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {rt.title}
                      </Typography>
                      <Chip
                        label={rt.list?.title || '—'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {rt.user ? (
                          <>
                            <Avatar
                              src={rt.user.profileImage ? `http://localhost:3000${rt.user.profileImage}` : undefined}
                              sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: 'primary.main' }}
                            >
                              {!rt.user.profileImage && rt.user.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" noWrap>{rt.user.name}</Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Comments */}
            <Divider sx={{ my: 3 }} />
            <CommentsSection cardId={card.id} cardDescription={card.description} />
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }}>
            {/* Priority */}
            {priorityConfig && (
              <DetailField icon={<Flag sx={{ fontSize: 18 }} />} label={t('priority.label')}>
                <Chip
                  label={`${priorityConfig.icon} ${t(priorityConfig.labelKey)}`}
                  size="small"
                  sx={{
                    backgroundColor: priorityConfig.bg,
                    color: priorityConfig.color,
                    fontWeight: 600,
                  }}
                />
              </DetailField>
            )}

            {/* Due Date */}
            {card.dueDate && (() => {
              const dueDateColors = getDueDateColors(card.dueDate!);
              return (
                <DetailField icon={<CalendarToday sx={{ fontSize: 18 }} />} label={t('dueDate.deadline')}>
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
                </DetailField>
              );
            })()}

            {/* Assignee */}
            {displayUser && (
              <DetailField icon={<Person sx={{ fontSize: 18 }} />} label={t('filters.assignees')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={displayUser.profileImage ? `http://localhost:3000${displayUser.profileImage}` : undefined}
                    sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}
                  >
                    {!displayUser.profileImage && displayUser.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                      {displayUser.name}
                    </Typography>
                    {displayUser.email && (
                      <Typography variant="caption" color="text.secondary">
                        {displayUser.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </DetailField>
            )}

            {/* Assign to me button */}
            {!isAssignedToMe && currentUser?.id && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                onClick={handleAssignMe}
                disabled={assigning}
                fullWidth
                sx={{ textTransform: 'none', mb: 2 }}
              >
                {assigning ? t('assignee.assigning') : t('assignee.assignMe')}
              </Button>
            )}

            {/* List / Status selector */}
            <DetailField icon={<ListIcon sx={{ fontSize: 18 }} />} label={t('task.list')}>
              {boardLists.length > 0 ? (
                <FormControl size="small" fullWidth>
                  <Select
                    value={displayListId}
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
                <Chip label={displayListTitle} size="small" variant="outlined" />
              )}
            </DetailField>

            <Divider sx={{ my: 2 }} />

            {/* Timestamps */}
            {card.createdAt && (
              <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.createdAt')}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(i18n.language, card.createdAt)}
                </Typography>
              </DetailField>
            )}
            {card.updatedAt && (
              <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.updatedAt')}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(i18n.language, card.updatedAt)}
                </Typography>
              </DetailField>
            )}
          </Box>
        </Box>
      </DialogContent>

      <EditCardDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        card={card ? {
          id: card.id,
          title: card.title,
          description: card.description,
          priority: card.priority,
          dueDate: card.dueDate,
          userId: card.user?.id,
          user: card.user || null,
          parentId: card.parentId,
        } : null}
        boardId={boardId}
        onCardUpdated={() => {
          setEditOpen(false);
          onCardUpdated?.();
        }}
      />

      {/* Delete confirmation dialog */}
    <DeleteCartDialog setDeleteConfirmOpen={setDeleteConfirmOpen} deleting={ deleting} t={t} deleteConfirmOpen={deleteConfirmOpen} handleDelete={handleDelete} card={card}/>
    </Dialog>
  );
}