import { useState, useEffect } from 'react';
import { Dialog, DialogContent, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EditCardDialog from './EditCardDialog';
import DeleteCartDialog from './Ticket/DeleteCartDialog';
import DialogHeader from './TicketDetailDialog/DialogHeader';
import DialogMainContent from './TicketDetailDialog/DialogMainContent';
import DialogSidebar from './TicketDetailDialog/DialogSidebar';
import { PRIORITY_CONFIG } from '../helpers/utils/color';
import type { TicketDetailDialogProps } from '../helpers/types/cardType';
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
      <DialogHeader
        card={card}
        displayListTitle={displayListTitle}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteConfirmOpen(true)}
        onClose={onClose}
        t={t}
      />

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <DialogMainContent card={card} displayReleaseTasks={displayReleaseTasks} t={t} />
          
          <DialogSidebar
            card={card}
            priorityConfig={priorityConfig}
            displayUser={displayUser}
            displayListId={displayListId}
            displayListTitle={displayListTitle}
            boardLists={boardLists}
            isAssignedToMe={isAssignedToMe}
            currentUser={currentUser}
            updatingList={updatingList}
            assigningUser={assigningUser}
            onListChange={handleListChange}
            onAssignMe={handleAssignMe}
            t={t}
            i18n={i18n}
          />
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

      <DeleteCartDialog
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        deleting={deletingCard}
        t={t}
        deleteConfirmOpen={deleteConfirmOpen}
        handleDelete={handleDelete}
        card={card}
      />
    </Dialog>
  );
}

