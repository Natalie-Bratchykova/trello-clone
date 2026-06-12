import {
    Box, Button, Checkbox,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    TextField,
    Typography
} from "@mui/material";
import {Add, CleaningServices, Delete, DeleteForever, Edit, Flag, MoreVert, Warning} from "@mui/icons-material";
import {PRIORITY_OPTIONS} from "../../../helpers/utils/color.ts";
import TicketCard from "../../Ticket/TicketCard.tsx";
import {t} from "i18next";
import ClearListConfirmation from "./ConfirmationDialogs/ClearListConfirmation.tsx";
import DeleteAllTicketsConfirmation from "./ConfirmationDialogs/DeleteAllTicketsConfirmation.tsx";
import DeleteTasksByPrioConfirmation from "./ConfirmationDialogs/DeleteTasksByPrioConfirmation.tsx";
import DeleteListConfirmation from "./ConfirmationDialogs/DeleteListConfirmation.tsx";
import {memo} from "react";

function BoarderColumnVisual(props) {
    let {dropRef,
        inputRef,
        editTitle,
        isEditing,
        setEditTitle,
        handleEditSave,
        handleEditCancel,
        handleClearClick,
        handleDeleteClick,
        updating,
        onCardClick,
        handleMenuOpen,
        handleEditStart,
        menuAnchor,
        handleDeleteAllTicketsClick,
        handleDeleteByPriorityClick,
        prioritySubmenuAnchor,
        setPrioritySubmenuAnchor,
        togglePriority,
        selectedPriorities,
        handlePriorityDeleteProceed,
        externalSortActive,
        list,
        handleMenuClose,
        isBacklog,
        setCardDialogState
    } = props;

    let {clearConfirmOpen, setClearConfirmOpen, handleClearConfirm, clearing} = props;
    let {deleteAllTicketsOpen,setDeleteAllTicketsOpen, handleDeleteAllTicketsConfirm,bulkDeletingAll} = props;
    let { deleteByPriorityOpen, setDeleteByPriorityOpen, handleDeleteByPriorityConfirm, bulkDeletingPriority, matchingPriorityCards } = props;
    let {deleteConfirmOpen, setDeleteConfirmOpen, handleDeleteConfirm, deleting} = props;
    return( <Paper
        ref={dropRef}
        sx={{
            minWidth: 300,
            maxWidth: 300,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 300px)',
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
                <ListItemText>{t('column.rename')}</ListItemText>
            </MenuItem>
            {!isBacklog && list.cards.length > 0 && (
                <MenuItem onClick={handleClearClick}>
                    <ListItemIcon>
                        <CleaningServices fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText>{t('column.clearList')}</ListItemText>
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
                    <ListItemText>{t('column.deleteAllTickets')}</ListItemText>
                </MenuItem>
            )}
            {list.cards.length > 0 && (
                <MenuItem onClick={handleDeleteByPriorityClick}>
                    <ListItemIcon>
                        <Flag fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>{t('column.deleteByPriority')}</ListItemText>
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
                    <ListItemText>{t('column.deleteList')}</ListItemText>
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
                {t('column.selectPriorities')}
            </Typography>
            {PRIORITY_OPTIONS.map((opt) => {
                const count = list.cards.filter((c) => (c.priority || '') === opt[0]).length;
                return (
                    <MenuItem key={opt[0]} onClick={() => togglePriority(opt[0])} dense>
                        <Checkbox size="small" checked={selectedPriorities.includes(opt[0])} sx={{ p: 0, mr: 1 }} />
                        <ListItemText primary={`${opt[1].icon} ${t(opt[1].labelKey)} (${count})`} />
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
                    {t('common.delete')} ({list.cards.filter((c) => selectedPriorities.includes(c.priority || '')).length})
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
                {t('board.addCard')}
            </Button>
        </Box>

        {/* Clear List Confirmation Dialog */}
       <ClearListConfirmation {...{clearConfirmOpen, setClearConfirmOpen, handleClearConfirm, clearing, list}}/>

        {/* Delete All Tickets Confirmation Dialog */}
        <DeleteAllTicketsConfirmation {...{deleteAllTicketsOpen,setDeleteAllTicketsOpen, handleDeleteAllTicketsConfirm,bulkDeletingAll, list}} />

        {/* Delete By Priority Confirmation Dialog */}
        <DeleteTasksByPrioConfirmation {...{
            deleteByPriorityOpen,
            setDeleteByPriorityOpen,
            handleDeleteByPriorityConfirm,
            bulkDeletingPriority,
            list,
            matchingPriorityCards,
            selectedPriorities
        }}/>

        {/* Delete List Confirmation Dialog */}
        <DeleteListConfirmation {...{deleteConfirmOpen, setDeleteConfirmOpen, handleDeleteConfirm, deleting}}/>
    </Paper>)
}

export default memo(BoarderColumnVisual);