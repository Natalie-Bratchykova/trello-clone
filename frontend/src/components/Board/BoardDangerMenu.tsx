import {
  Box,
  Button,
  Checkbox,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { DeleteSweep, DeleteForever, Flag } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PRIORITY_OPTIONS } from '../../helpers/utils/color';
import { useBoardDanger } from '../../context/BoardDangerContext';
import { useBoardFilter } from '../../context/BoardFilterContext';

export default function BoardDangerMenu() {
  const { t } = useTranslation();
  const { board, totalCardCount } = useBoardFilter();
  const {
    dangerMenuAnchor,
    setDangerMenuAnchor,
    setDeleteAllConfirmOpen,
    setDeleteAllTicketsBoardOpen,
    setSelectedBoardPriorities,
    setBoardPrioritySubmenuAnchor,
    boardPrioritySubmenuAnchor,
    selectedBoardPriorities,
    toggleBoardPriority,
    boardPriorityMatchCount,
    setDeletePriorityBoardOpen,
  } = useBoardDanger();

  if (!board) return null;

  return (
    <>
      <Menu
        anchorEl={dangerMenuAnchor}
        open={Boolean(dangerMenuAnchor)}
        onClose={() => setDangerMenuAnchor(null)}
      >
        {board.lists.filter((l) => l.position !== 0).length > 0 && (
          <MenuItem
            onClick={() => {
              setDangerMenuAnchor(null);
              setDeleteAllConfirmOpen(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteSweep fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{t('danger.deleteAllLists')}</ListItemText>
          </MenuItem>
        )}
        {totalCardCount > 0 && (
          <MenuItem
            onClick={() => {
              setDangerMenuAnchor(null);
              setDeleteAllTicketsBoardOpen(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteForever fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{t('danger.deleteAllTickets', { count: totalCardCount })}</ListItemText>
          </MenuItem>
        )}
        {totalCardCount > 0 && (
          <MenuItem
            onClick={(e) => {
              setDangerMenuAnchor(null);
              setSelectedBoardPriorities([]);
              setBoardPrioritySubmenuAnchor(e.currentTarget);
            }}
          >
            <ListItemIcon>
              <Flag fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{t('danger.deleteByPriority')}</ListItemText>
          </MenuItem>
        )}
        {board.lists.filter((l) => l.position !== 0).length === 0 && totalCardCount === 0 && (
          <MenuItem disabled>
            <ListItemText>{t('common.noActions')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Board priority submenu */}
      <Menu
        anchorEl={boardPrioritySubmenuAnchor}
        open={Boolean(boardPrioritySubmenuAnchor)}
        onClose={() => setBoardPrioritySubmenuAnchor(null)}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, fontWeight: 600, color: 'text.secondary' }}
        >
          {t('danger.selectPrioritiesForDeletion')}
        </Typography>
        {PRIORITY_OPTIONS.map((opt) => {
          const count = board.lists.reduce(
            (sum, l) => sum + l.cards.filter((c) => (c.priority || '') === opt[0]).length,
            0,
          );
          return (
            <MenuItem key={opt[0]} onClick={() => toggleBoardPriority(opt[0])} dense>
              <Checkbox
                size="small"
                checked={selectedBoardPriorities.includes(opt[0])}
                sx={{ p: 0, mr: 1 }}
              />
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
            disabled={selectedBoardPriorities.length === 0}
            onClick={() => {
              setBoardPrioritySubmenuAnchor(null);
              setDeletePriorityBoardOpen(true);
            }}
          >
            {t('common.delete')} ({boardPriorityMatchCount})
          </Button>
        </Box>
      </Menu>
    </>
  );
}

