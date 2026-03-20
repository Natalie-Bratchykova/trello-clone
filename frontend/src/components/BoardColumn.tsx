import { useState, useRef } from 'react';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Checkbox,
    Divider,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Warning, CleaningServices, DeleteForever, Flag } from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import TicketCard from './TicketCard.tsx';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../helpers/types/ItemTypes.ts';
import { BULK_DELETE_CARDS_BY_LIST, BULK_DELETE_CARDS_BY_PRIORITY } from '../helpers/gql/boardGQL';

const UPDATE_LIST_MUTATION = gql`
  mutation UpdateListTitle($id: ID!, $data: UpdateListInput!) {
    updateList(id: $id, data: $data) {
      id
      title
    }
  }
`;

const DELETE_LIST_MUTATION = gql`
  mutation DeleteListFromBoard($id: ID!) {
    deleteList(id: $id)
  }
`;

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'Низький', icon: '🟢' },
    { value: 'MEDIUM', label: 'Середній', icon: '🟠' },
    { value: 'HIGH', label: 'Високий', icon: '🔴' },
];

export interface BoardColumnProps {
    list: {
        id: string;
        title: string;
        position: number;
        cards: {
            id: number;
            title: string;
            description: string;
            position: number;
            dueDate: string | null;
            priority?: string;
            user: {
                id: number;
                name: string;
            } | null;
        }[];
    };
    lastDroppedCardId?: string | null;
    onDrop: (item: any) => void;
    onCardClick?: (card: any, listTitle: string) => void;
    setCardDialogState: (state: { open: boolean; listId: string; listTitle: string }) => void;
    onListUpdated?: () => void;
    externalSortActive?: boolean;
    isBacklog?: boolean;
    onClearList?: (listId: string, cards: any[]) => Promise<void>;
}

export default function BoardColumn({ list, setCardDialogState, lastDroppedCardId, onDrop, onCardClick, onListUpdated, externalSortActive, isBacklog, onClearList }: BoardColumnProps) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(list.title);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    // Bulk delete tickets state
    const [deleteAllTicketsOpen, setDeleteAllTicketsOpen] = useState(false);
    const [deleteByPriorityOpen, setDeleteByPriorityOpen] = useState(false);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [prioritySubmenuAnchor, setPrioritySubmenuAnchor] = useState<null | HTMLElement>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const [updateList, { loading: updating }] = useMutation(UPDATE_LIST_MUTATION);
    const [deleteList, { loading: deleting }] = useMutation(DELETE_LIST_MUTATION);
    const [bulkDeleteByList, { loading: bulkDeletingAll }] = useMutation(BULK_DELETE_CARDS_BY_LIST);
    const [bulkDeleteByPriority, { loading: bulkDeletingPriority }] = useMutation(BULK_DELETE_CARDS_BY_PRIORITY);

    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: [ItemTypes.TICKET],
        drop: onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleEditStart = () => {
        handleMenuClose();
        setEditTitle(list.title);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleEditSave = async () => {
        if (!editTitle.trim() || editTitle.trim() === list.title) {
            setIsEditing(false);
            return;
        }
        try {
            await updateList({
                variables: { id: list.id, data: { title: editTitle.trim() } },
            });
            setIsEditing(false);
            onListUpdated?.();
        } catch (err) {
            console.error('Error updating list:', err);
        }
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditTitle(list.title);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        setDeleteConfirmOpen(true);
    };

    const handleClearClick = () => {
        handleMenuClose();
        setClearConfirmOpen(true);
    };

    const handleClearConfirm = async () => {
        if (!onClearList) return;
        setClearing(true);
        try {
            await onClearList(list.id, list.cards);
            setClearConfirmOpen(false);
        } catch (err) {
            console.error('Error clearing list:', err);
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteList({ variables: { id: list.id } });
            setDeleteConfirmOpen(false);
            onListUpdated?.();
        } catch (err) {
            console.error('Error deleting list:', err);
        }
    };

    // Bulk delete all tickets in column
    const handleDeleteAllTicketsClick = () => {
        handleMenuClose();
        setDeleteAllTicketsOpen(true);
    };

    const handleDeleteAllTicketsConfirm = async () => {
        try {
            await bulkDeleteByList({
                variables: { listId: list.id },
                update(cache, { data }) {
                    const deletedIds: string[] = data?.bulkDeleteCardsByList ?? [];
                    for (const cardId of deletedIds) {
                        cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
                    }
                    cache.modify({
                        id: cache.identify({ __typename: 'ListObject', id: list.id }),
                        fields: {
                            cards() { return []; },
                        },
                    });
                    cache.gc();
                },
            });
            setDeleteAllTicketsOpen(false);
        } catch (err) {
            console.error('Error bulk deleting tickets:', err);
        }
    };

    // Delete by priority
    const handleDeleteByPriorityClick = (e: React.MouseEvent<HTMLElement>) => {
        handleMenuClose();
        setSelectedPriorities([]);
        setPrioritySubmenuAnchor(e.currentTarget);
    };

    const togglePriority = (p: string) => {
        setSelectedPriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
    };

    const handlePriorityDeleteProceed = () => {
        setPrioritySubmenuAnchor(null);
        setDeleteByPriorityOpen(true);
    };

    const matchingPriorityCards = list.cards.filter((c) => selectedPriorities.includes(c.priority || ''));

    const handleDeleteByPriorityConfirm = async () => {
        try {
            for (const priority of selectedPriorities) {
                await bulkDeleteByPriority({
                    variables: { priority, listId: list.id },
                    update(cache, { data }) {
                        const deletedIds: string[] = data?.bulkDeleteCardsByPriority ?? [];
                        for (const cardId of deletedIds) {
                            cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
                        }
                        cache.modify({
                            id: cache.identify({ __typename: 'ListObject', id: list.id }),
                            fields: {
                                cards(existingRefs: any[] = [], { readField }) {
                                    return existingRefs.filter((ref) => !deletedIds.includes(readField('id', ref) as string));
                                },
                            },
                        });
                        cache.gc();
                    },
                });
            }
            setDeleteByPriorityOpen(false);
            setSelectedPriorities([]);
        } catch (err) {
            console.error('Error deleting by priority:', err);
        }
    };

    return (
        <Paper
            ref={dropRef}
            sx={{
                minWidth: 300,
                maxWidth: 300,
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 250px)',
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                {isEditing ? (
                    <TextField
                        inputRef={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                        }}
                        onBlur={handleEditSave}
                        size="small"
                        variant="outlined"
                        disabled={updating}
                        fullWidth
                        sx={{
                            '& .MuiInputBase-input': {
                                py: 0.5,
                                fontWeight: 600,
                                fontSize: '1.25rem',
                            },
                        }}
                    />
                ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {list.title}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, ml: 1, flexShrink: 0 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            backgroundColor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                        }}
                    >
                        {list.cards.length}
                    </Typography>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* 3-dot Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={handleEditStart}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Перейменувати</ListItemText>
                </MenuItem>
                {!isBacklog && list.cards.length > 0 && (
                    <MenuItem onClick={handleClearClick}>
                        <ListItemIcon>
                            <CleaningServices fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText>Очистити список</ListItemText>
                    </MenuItem>
                )}
                {list.cards.length > 0 && (
                    <Divider />
                )}
                {list.cards.length > 0 && (
                    <MenuItem onClick={handleDeleteAllTicketsClick} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <DeleteForever fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Видалити всі тікети</ListItemText>
                    </MenuItem>
                )}
                {list.cards.length > 0 && (
                    <MenuItem onClick={handleDeleteByPriorityClick}>
                        <ListItemIcon>
                            <Flag fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Видалити за пріоритетом</ListItemText>
                    </MenuItem>
                )}
                {!isBacklog && (
                    <Divider />
                )}
                {!isBacklog && (
                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <Delete fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Видалити список</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            {/* Priority submenu for selecting priorities to delete */}
            <Menu
                anchorEl={prioritySubmenuAnchor}
                open={Boolean(prioritySubmenuAnchor)}
                onClose={() => setPrioritySubmenuAnchor(null)}
            >
                <Typography variant="caption" sx={{ px: 2, py: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                    Оберіть пріоритети:
                </Typography>
                {PRIORITY_OPTIONS.map((opt) => {
                    const count = list.cards.filter((c) => (c.priority || '') === opt.value).length;
                    return (
                        <MenuItem key={opt.value} onClick={() => togglePriority(opt.value)} dense>
                            <Checkbox size="small" checked={selectedPriorities.includes(opt.value)} sx={{ p: 0, mr: 1 }} />
                            <ListItemText primary={`${opt.icon} ${opt.label} (${count})`} />
                        </MenuItem>
                    );
                })}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ px: 2, pb: 1 }}>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        fullWidth
                        disabled={selectedPriorities.length === 0}
                        onClick={handlePriorityDeleteProceed}
                    >
                        Видалити ({list.cards.filter((c) => selectedPriorities.includes(c.priority || '')).length})
                    </Button>
                </Box>
            </Menu>

            {/* Cards */}
            <Box
                sx={{
                    p: 1,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {(externalSortActive ? list.cards : [...list.cards].sort((a, b) => a.position - b.position))
                    .map((card) => (
                        <TicketCard key={card.id} card={card} onClick={() => onCardClick?.(card, list.title)} />
                    ))}
            </Box>

            {/* Add Card Button */}
            <Box sx={{ p: 1 }}>
                <Button
                    fullWidth
                    startIcon={<Add />}
                    sx={{ justifyContent: 'flex-start' }}
                    onClick={() =>
                        setCardDialogState({
                            open: true,
                            listId: list.id,
                            listTitle: list.title,
                        })
                    }
                >
                    Додати картку
                </Button>
            </Box>

            {/* Clear List Confirmation Dialog */}
            <Dialog open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CleaningServices color="warning" />
                    Очистити список?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете очистити список <strong>"{list.title}"</strong>?
                    </DialogContentText>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
                        <Typography variant="body2">
                            📋 Усі {list.cards.length} карток із цього списку будуть переміщені до колонки <strong>Backlog</strong>.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setClearConfirmOpen(false)} disabled={clearing}>
                        Скасувати
                    </Button>
                    <Button onClick={handleClearConfirm} variant="contained" color="warning" disabled={clearing}>
                        {clearing ? 'Переміщення...' : 'Так, очистити'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete All Tickets Confirmation Dialog */}
            <Dialog open={deleteAllTicketsOpen} onClose={() => setDeleteAllTicketsOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Видалити всі тікети?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете <strong>назавжди видалити</strong> всі тікети зі списку <strong>"{list.title}"</strong>?
                    </DialogContentText>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                        <Typography variant="body2" fontWeight={600}>
                            🗑️ Буде видалено {list.cards.length} {list.cards.length === 1 ? 'тікет' : 'тікетів'} разом з усіма коментарями.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Цю дію не можна скасувати!
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteAllTicketsOpen(false)} disabled={bulkDeletingAll}>
                        Скасувати
                    </Button>
                    <Button onClick={handleDeleteAllTicketsConfirm} variant="contained" color="error" disabled={bulkDeletingAll}>
                        {bulkDeletingAll ? 'Видалення...' : 'Так, видалити всі'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete By Priority Confirmation Dialog */}
            <Dialog open={deleteByPriorityOpen} onClose={() => setDeleteByPriorityOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Видалити за пріоритетом?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете <strong>назавжди видалити</strong> тікети з обраними пріоритетами зі списку <strong>"{list.title}"</strong>?
                    </DialogContentText>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                        <Typography variant="body2" fontWeight={600}>
                            🗑️ Буде видалено {matchingPriorityCards.length} {matchingPriorityCards.length === 1 ? 'тікет' : 'тікетів'}:
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                            {selectedPriorities.map((p) => {
                                const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
                                const count = list.cards.filter((c) => (c.priority || '') === p).length;
                                return (
                                    <Typography key={p} variant="body2">
                                        {opt?.icon} {opt?.label}: {count} тікетів
                                    </Typography>
                                );
                            })}
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Цю дію не можна скасувати!
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteByPriorityOpen(false)} disabled={bulkDeletingPriority}>
                        Скасувати
                    </Button>
                    <Button onClick={handleDeleteByPriorityConfirm} variant="contained" color="error" disabled={bulkDeletingPriority}>
                        {bulkDeletingPriority ? 'Видалення...' : `Так, видалити (${matchingPriorityCards.length})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete List Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Видалити список?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете видалити список <strong>"{list.title}"</strong>?
                    </DialogContentText>
                    {list.cards.length > 0 ? (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
                            <Typography variant="body2">
                                📋 Усі {list.cards.length} карток із цього списку будуть переміщені до колонки <strong>Backlog</strong>.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, color: 'text.secondary' }}>
                            <Typography variant="body2">
                                Цей список порожній і буде видалений.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                        Скасувати
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}>
                        {deleting ? 'Видалення...' : 'Так, видалити'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
