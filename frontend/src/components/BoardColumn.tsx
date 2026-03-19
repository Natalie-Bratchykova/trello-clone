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
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Warning } from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import TicketCard from './TicketCard.tsx';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../helpers/types/ItemTypes.ts';

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
}

export default function BoardColumn({ list, setCardDialogState, lastDroppedCardId, onDrop, onCardClick, onListUpdated }: BoardColumnProps) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(list.title);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [updateList, { loading: updating }] = useMutation(UPDATE_LIST_MUTATION);
    const [deleteList, { loading: deleting }] = useMutation(DELETE_LIST_MUTATION);

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

    const handleDeleteConfirm = async () => {
        try {
            await deleteList({ variables: { id: list.id } });
            setDeleteConfirmOpen(false);
            onListUpdated?.();
        } catch (err) {
            console.error('Error deleting list:', err);
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
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <Delete fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Видалити</ListItemText>
                </MenuItem>
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
                {[...list.cards]
                    .sort((a, b) => a.position - b.position)
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Видалити список?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете видалити список <strong>"{list.title}"</strong>?
                    </DialogContentText>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                        <Typography variant="body2">
                            ⚠️ Це також видалить всі {list.cards.length} карток у цьому списку та їх коментарі. Цю дію не можна скасувати.
                        </Typography>
                    </Box>
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
