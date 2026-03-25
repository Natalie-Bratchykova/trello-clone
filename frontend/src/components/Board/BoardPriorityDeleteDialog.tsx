import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PRIORITY_OPTIONS } from '../../helpers/utils/color';
import { useBoardDanger } from '../../context/BoardDangerContext';
import { useBoardFilter } from '../../context/BoardFilterContext';

export default function BoardPriorityDeleteDialog() {
  const { t } = useTranslation();
  const { board } = useBoardFilter();
  const {
    deletePriorityBoardOpen,
    setDeletePriorityBoardOpen,
    selectedBoardPriorities,
    boardPriorityMatchCount,
    handleDeleteByPriorityBoard,
    deletingPriorityBoard,
  } = useBoardDanger();

  return (
    <Dialog
      open={deletePriorityBoardOpen}
      onClose={() => setDeletePriorityBoardOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="error" />
        {t('danger.deleteByPriorityTitle')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{t('danger.deleteByPriorityConfirm')}</DialogContentText>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
          <Typography variant="body2" fontWeight={600}>
            {t('danger.willDeleteByPriority', { count: boardPriorityMatchCount })}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {selectedBoardPriorities.map((p) => {
              const opt = PRIORITY_OPTIONS.find((o) => o[0] === p);
              const count = board
                ? board.lists.reduce(
                    (sum, l) => sum + l.cards.filter((c) => (c.priority || '') === p).length,
                    0,
                  )
                : 0;
              return (
                <Typography key={p} variant="body2">
                  {opt?.[1]?.icon} {opt ? t(opt[1].labelKey) : ''}: {count}
                </Typography>
              );
            })}
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {t('column.cannotUndo')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDeletePriorityBoardOpen(false)} disabled={deletingPriorityBoard}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleDeleteByPriorityBoard}
          variant="contained"
          color="error"
          disabled={deletingPriorityBoard}
        >
          {deletingPriorityBoard
            ? t('common.deleting')
            : `${t('deleteConfirm.yesDelete')} (${boardPriorityMatchCount})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

