import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoardActions } from './useBoardActions';
import { useListActions } from './useListActions';
import { useBoardValidation } from './useBoardValidation';
import type { ListItem } from '../helpers/types/listTypes';

interface SaveBoardDataInput {
  id: string;
  title: string;
  color: string;
  boardIdentifier: string;
  lists: ListItem[];
  originalLists: ListItem[];
}

/**
 * Custom hook for Project Edit Page operations
 * Combines board actions, list actions, and validation
 */
export function useProjectEdit(boardId?: string) {
  const { t } = useTranslation();
  const boardActions = useBoardActions(boardId);
  const listActions = useListActions(boardId);
  const validation = useBoardValidation();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSuccess = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  /**
   * Saves board information and reorders lists if needed
   */
  const saveBoardWithReorder = useCallback(
    async (input: SaveBoardDataInput) => {
      // Validate
      const isValid = validation.validate({
        title: input.title,
        boardIdentifier: input.boardIdentifier,
      });

      if (!isValid) {
        return { success: false, error: 'Validation failed' };
      }

      try {
        // Update board info
        const boardResult = await boardActions.updateBoard(input.id, {
          title: input.title.trim(),
          color: input.color,
          boardIdentifier: input.boardIdentifier.trim() || undefined,
        });

        if (!boardResult.success) {
          throw new Error('Failed to update board');
        }

        // Find lists that need position updates
        const listsToReorder = input.lists.filter((list) => {
          const original = input.originalLists.find((o) => o.id === list.id);
          return original && original.position !== list.position;
        });

        // Reorder lists if needed
        if (listsToReorder.length > 0) {
          const reorderResult = await listActions.reorderLists(
            listsToReorder.map((list) => ({
              id: list.id,
              position: list.position,
            }))
          );

          if (!reorderResult.success) {
            throw new Error('Failed to reorder lists');
          }
        }

        showSuccess(t('projectEdit.updateSuccess'));
        return { success: true };
      } catch (error) {
        console.error('Error saving board:', error);
        showError(t('projectEdit.saveError'));
        return { success: false, error };
      }
    },
    [boardActions, listActions, validation, showSuccess, showError, t]
  );

  /**
   * Creates a new list
   */
  const addList = useCallback(
    async (title: string, boardId: string) => {
      try {
        const result = await listActions.createList({ title, boardId });
        if (result.success) {
          showSuccess(t('projectEdit.columnAdded'));
        } else {
          throw new Error('Failed to create list');
        }
        return result;
      } catch (error) {
        console.error('Error creating list:', error);
        showError(t('projectEdit.columnAddError'));
        return { success: false, error };
      }
    },
    [listActions, showSuccess, showError, t]
  );

  /**
   * Renames a list
   */
  const renameList = useCallback(
    async (listId: string, newTitle: string) => {
      try {
        const result = await listActions.updateList(listId, { title: newTitle }, true);
        if (!result.success) {
          throw new Error('Failed to rename list');
        }
        return result;
      } catch (error) {
        console.error('Error renaming list:', error);
        showError(t('projectEdit.renameError'));
        return { success: false, error };
      }
    },
    [listActions, showError, t]
  );

  /**
   * Deletes a list
   */
  const deleteList = useCallback(
    async (listId: string) => {
      try {
        const result = await listActions.deleteList(listId);
        if (result.success) {
          showSuccess(t('projectEdit.columnDeleted'));
        } else {
          throw new Error('Failed to delete list');
        }
        return result;
      } catch (error) {
        console.error('Error deleting list:', error);
        showError(t('projectEdit.columnDeleteError'));
        return { success: false, error };
      }
    },
    [listActions, showSuccess, showError, t]
  );

  return {
    // Combined actions
    saveBoardWithReorder,
    addList,
    renameList,
    deleteList,

    // Validation
    validation,

    // Snackbar
    snackbar,
    showSuccess,
    showError,
    closeSnackbar,

    // Loading states from underlying hooks
    savingBoard: boardActions.updatingBoard,
    creatingList: listActions.creatingList,
    deletingList: listActions.deletingList,
  };
}

