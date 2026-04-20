import { useState } from 'react';
import { Box, Paper, Typography, Button, TextField, IconButton, Tooltip } from '@mui/material';
import { Add, DragIndicator, Edit, Check, Close, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ListItem } from '../../helpers/types/listTypes';

interface ColumnsListSectionProps {
  lists: ListItem[];
  color: string;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRename: (listId: string, newTitle: string) => Promise<void>;
  onDelete: (listId: string) => Promise<void>;
  onAdd: (title: string) => Promise<void>;
  isCreating: boolean;
}

export default function ColumnsListSection({
  lists,
  color,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRename,
  onDelete,
  onAdd,
  isCreating,
}: ColumnsListSectionProps) {
  const { t } = useTranslation();
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);

  const handleRenameSubmit = async (listId: string) => {
    if (!editingListTitle.trim()) return;
    await onRename(listId, editingListTitle.trim());
    setEditingListId(null);
    setEditingListTitle('');
  };

  const handleAddSubmit = async () => {
    if (!newListTitle.trim()) return;
    await onAdd(newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('projectEdit.columns')} ({lists.length})
        </Typography>
        {!isAddingList && (
          <Button size="small" startIcon={<Add />} onClick={() => setIsAddingList(true)} sx={{ textTransform: 'none' }}>
            {t('projectEdit.addColumn')}
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('projectEdit.dragHint')}
      </Typography>

      {lists.length === 0 && !isAddingList && (
        <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('projectEdit.noColumns')}
          </Typography>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setIsAddingList(true)}>
            {t('projectEdit.addFirstColumn')}
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {lists.map((list, index) => (
          <Box
            key={list.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: dragOverIndex === index ? 'primary.main' : 'divider',
              backgroundColor:
                draggedIndex === index
                  ? 'action.disabledBackground'
                  : dragOverIndex === index
                  ? 'primary.50'
                  : 'background.paper',
              opacity: draggedIndex === index ? 0.5 : 1,
              cursor: 'grab',
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': { borderColor: 'primary.light' },
            }}
          >
            <DragIndicator sx={{ color: 'text.disabled', cursor: 'grab', flexShrink: 0 }} />

            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Box>

            {editingListId === list.id ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                <TextField
                  size="small"
                  value={editingListTitle}
                  onChange={(e) => setEditingListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(list.id);
                    if (e.key === 'Escape') {
                      setEditingListId(null);
                      setEditingListTitle('');
                    }
                  }}
                  autoFocus
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { py: 0.75 } }}
                />
                <IconButton size="small" color="primary" onClick={() => handleRenameSubmit(list.id)}>
                  <Check fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingListId(null);
                    setEditingListTitle('');
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
                {list.title}
              </Typography>
            )}

            {editingListId !== list.id && (
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title={t('column.rename')}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingListId(list.id);
                      setEditingListTitle(list.title);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('common.delete')}>
                  <IconButton size="small" color="error" onClick={() => onDelete(list.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        ))}

        {isAddingList && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            }}
          >
            <Add sx={{ color: 'primary.main', flexShrink: 0 }} />
            <TextField
              size="small"
              placeholder={t('projectEdit.newColumnPlaceholder')}
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubmit();
                if (e.key === 'Escape') {
                  setIsAddingList(false);
                  setNewListTitle('');
                }
              }}
              autoFocus
              fullWidth
              disabled={isCreating}
              sx={{ '& .MuiInputBase-input': { py: 0.75 } }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleAddSubmit}
              disabled={isCreating || !newListTitle.trim()}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {t('common.add')}
            </Button>
            <IconButton
              size="small"
              onClick={() => {
                setIsAddingList(false);
                setNewListTitle('');
              }}
              disabled={isCreating}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

