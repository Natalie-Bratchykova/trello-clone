import { useCallback } from 'react';
import { useMutation, useApolloClient } from '@apollo/client/react';
import {
  CREATE_LIST_MUTATION,
  UPDATE_LIST_MUTATION,
  UPDATE_LIST_MUTATION_SMALL,
  DELETE_LIST_MUTATION,
  MOVE_LIST_MUTATION,
} from '../helpers/gql/listGQL';
import { BULK_DELETE_CARDS_BY_LIST, GET_BOARD } from '../helpers/gql/boardGQL';
import type { Card } from '../helpers/types/BoardTypes';

interface CreateListInput {
  title: string;
  boardId: string;
}

interface UpdateListInput {
  title?: string;
  position?: number;
}

/**
 * Custom hook for all list-related operations
 * Centralizes list mutations and cache updates
 */
export function useListActions(boardId?: string) {
  const client = useApolloClient();

  // ========== CREATE LIST ==========
  const [createListMutation, { loading: creatingList }] = useMutation(CREATE_LIST_MUTATION);

  const createList = useCallback(
    async (input: CreateListInput) => {
      try {
        const result = await createListMutation({
          variables: input,
          refetchQueries: boardId ? [{ query: GET_BOARD, variables: { id: boardId } }] : [],
        });
        return { success: true, data: result.data?.createList };
      } catch (error) {
        console.error('Error creating list:', error);
        return { success: false, error };
      }
    },
    [createListMutation, boardId]
  );

  // ========== UPDATE LIST ==========
  const [updateListMutation, { loading: updatingList }] = useMutation(UPDATE_LIST_MUTATION);
  const [updateListSmallMutation, { loading: updatingListSmall }] = useMutation(
    UPDATE_LIST_MUTATION_SMALL
  );

  const updateList = useCallback(
    async (id: string, data: UpdateListInput, smallUpdate: boolean = false) => {
      try {
        const mutation = smallUpdate ? updateListSmallMutation : updateListMutation;
        const result = await mutation({
          variables: { id, data },
        });
        return { success: true, data: result.data?.updateList };
      } catch (error) {
        console.error('Error updating list:', error);
        return { success: false, error };
      }
    },
    [updateListMutation, updateListSmallMutation]
  );

  // ========== DELETE LIST ==========
  const [deleteListMutation, { loading: deletingList }] = useMutation(DELETE_LIST_MUTATION);

  const deleteList = useCallback(
    async (id: string, shouldMoveCardsToBacklog: boolean = false, cards?: Card[]) => {
      try {
        // If moving cards to backlog first
        if (shouldMoveCardsToBacklog && cards && cards.length > 0 && boardId) {
          // This should be handled by the server or by moveMultipleCards from useCardActions
          // For now, we'll just delete and let server handle it
        }

        await deleteListMutation({
          variables: { id },
          refetchQueries: boardId ? [{ query: GET_BOARD, variables: { id: boardId } }] : [],
          update: (cache) => {
            // Remove list from cache
            cache.evict({ id: cache.identify({ __typename: 'ListObject', id }) });
            cache.gc();
          },
        });

        return { success: true };
      } catch (error) {
        console.error('Error deleting list:', error);
        return { success: false, error };
      }
    },
    [deleteListMutation, boardId]
  );

  // ========== MOVE LIST (reorder) ==========
  const [moveListMutation, { loading: movingList }] = useMutation(MOVE_LIST_MUTATION);

  const moveList = useCallback(
    async (listId: string, newPosition: number) => {
      try {
        const result = await moveListMutation({
          variables: { data: { listId, position: newPosition } },
        });
        return { success: true, data: result.data?.moveList };
      } catch (error) {
        console.error('Error moving list:', error);
        return { success: false, error };
      }
    },
    [moveListMutation]
  );

  // ========== CLEAR LIST (move all cards to backlog) ==========
  const clearList = useCallback(
    async (listId: string, cards: Card[], backlogListId: string) => {
      try {
        // This is a client-side operation that should use useCardActions.moveMultipleCards
        // For now, we'll mark it as a helper that needs card actions
        console.warn('clearList should use useCardActions.moveMultipleCards');
        return { success: false, error: 'Use useCardActions.moveMultipleCards instead' };
      } catch (error) {
        console.error('Error clearing list:', error);
        return { success: false, error };
      }
    },
    []
  );

  // ========== DELETE ALL CARDS IN LIST ==========
  const [deleteAllCardsInListMutation, { loading: deletingAllCards }] = useMutation(
    BULK_DELETE_CARDS_BY_LIST
  );

  const deleteAllCardsInList = useCallback(
    async (listId: string) => {
      try {
        await deleteAllCardsInListMutation({
          variables: { listId },
          refetchQueries: boardId ? [{ query: GET_BOARD, variables: { id: boardId } }] : [],
        });
        return { success: true };
      } catch (error) {
        console.error('Error deleting all cards in list:', error);
        return { success: false, error };
      }
    },
    [deleteAllCardsInListMutation, boardId]
  );

  // ========== REORDER LISTS (bulk update) ==========
  const reorderLists = useCallback(
    async (
      lists: Array<{ id: string; position: number; title?: string }>
    ): Promise<{ success: boolean; error?: any }> => {
      try {
        // Update all list positions
        await Promise.all(
          lists.map((list) =>
            updateListMutation({
              variables: {
                id: list.id,
                data: {
                  position: list.position,
                  ...(list.title ? { title: list.title } : {}),
                },
              },
            })
          )
        );

        // Refetch board to sync
        if (boardId) {
          await client.refetchQueries({
            include: [{ query: GET_BOARD, variables: { id: boardId } }],
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error reordering lists:', error);
        return { success: false, error };
      }
    },
    [updateListMutation, boardId, client]
  );

  return {
    // Actions
    createList,
    updateList,
    deleteList,
    moveList,
    clearList,
    deleteAllCardsInList,
    reorderLists,

    // Loading states
    creatingList,
    updatingList: updatingList || updatingListSmall,
    deletingList,
    movingList,
    deletingAllCards,
  };
}

