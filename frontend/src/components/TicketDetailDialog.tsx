import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
import { Close, CalendarToday, Person, Flag, AccessTime, Edit, AccountTree, Delete, PersonAdd, List as ListIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import CommentsSection from './CommentsSection';
import EditCardDialog from './EditCardDialog';
import {PRIORITY_CONFIG, getDueDateColors, getDueDateLabel} from "../helpers/utils/color.ts";
import { useTranslation } from 'react-i18next';
import {formatDate} from "../helpers/utils/dateLocale.ts";
import SubTask from "./Ticket/SubTask.tsx";
import DetailField from "./Ticket/DetailField.tsx";
import TextEditorUneditable from "./Ticket/TextEditorUneditable.tsx";
import DeleteCartDialog from "./Ticket/DeleteCartDialog.tsx";
import type {TicketDetailDialogProps} from "../helpers/types/cardType.ts";
import ReleaseIncludingTask from "./Ticket/Release/ReleaseIncludingTasks.tsx";
import {getUserProfileUrl} from "../helpers/utils/userHelper.ts";
import { useCardActions } from '../hooks/useCardActions';

export default function TicketDetailDialog({ open, onClose, card, listTitle, boardId, onCardUpdated, onCardDeleted }: TicketDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [displayUser, setDisplayUser] = useState(card?.user || null);
  const [displayListId, setDisplayListId] = useState(card?.listId || '');
  const [displayListTitle, setDisplayListTitle] = useState(listTitle || '');
  const [displayReleaseTasks, setDisplayReleaseTasks] = useState(card?.releaseTasks || []);
  const { t, i18n } = useTranslation();

  const {
    currentUser,
    boardLists,
    updatingList,
    deletingCard,
    assigningUser,
    handleAssignMe: assignMe,
    handleListChange: changeList,
    handleDeleteCard,
  } = useCardActions(card?.id, boardId);

  // Sync displayUser when card prop changes
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

  const isAssignedToMe = displayUser?.id === currentUser?.id;

  const handleListChange = async (newListId: string) => {
    if (!card || newListId === displayListId) return;
    const { updatedCard, movedReleaseTasks } = await changeList(newListId, displayListId);

    if (updatedCard) {
      setDisplayListId(updatedCard.listId);
      setDisplayListTitle(updatedCard.list?.title || '');
    }

    if (movedReleaseTasks && movedReleaseTasks.length > 0) {
      setDisplayReleaseTasks((prev) => {
        const movedMap = new Map(movedReleaseTasks.map((t) => [t.id, t]));
        return prev.map((rt) => {
          const moved = movedMap.get(rt.id);
          if (moved) {
            const newTitle = moved.list?.title || boardLists.find((l) => l.id === moved.listId)?.title || rt.list?.title;
            return { ...rt, listId: moved.listId, list: { id: moved.listId, title: newTitle || '—' } };
          }
          return rt;
        });
      });
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    const success = await handleDeleteCard();
    if (success) {
      setDeleteConfirmOpen(false);
      onClose();
      onCardDeleted?.();
    }
  };

  const handleAssignMe = async () => {
    if (!card) return;
    await assignMe();
    // The hook updates the cache; re-read user from card prop on next render.
    // But for immediate UI update we also set local state:
    if (currentUser) {
      setDisplayUser({ id: currentUser.id, name: currentUser.name, email: currentUser.email, profileImage: currentUser.profileImage });
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
              <ReleaseIncludingTask displayReleaseTasks={displayReleaseTasks}/>
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
                    src={getUserProfileUrl(displayUser.profileImage)}
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
                disabled={assigningUser}
                fullWidth
                sx={{ textTransform: 'none', mb: 2 }}
              >
                {assigningUser ? t('assignee.assigning') : t('assignee.assignMe')}
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

    <DeleteCartDialog setDeleteConfirmOpen={setDeleteConfirmOpen} deleting={deletingCard} t={t} deleteConfirmOpen={deleteConfirmOpen} handleDelete={handleDelete} card={card}/>
    </Dialog>
  );
}

