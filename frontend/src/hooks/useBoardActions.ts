import { useCallback } from 'react';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  DELETE_ALL_LISTS_EXCEPT_BACKLOG,
  BULK_DELETE_ALL_CARDS_BY_BOARD,
  BULK_DELETE_CARDS_BY_PRIORITY,
  GET_ALL_BOARDS,
  GET_BOARD,
} from '../helpers/gql/boardGQL';
import type { Board } from '../helpers/types/BoardTypes';
import {
  useCreateBoardMutation,
  useDeleteAllListsExceptBacklogMutation,
  useDeleteBoardMutation,
  useUpdateBoardMutation
} from "../generated/graphql.ts";

/**
 * Custom hook for all board-related operations
 * Centralizes board mutations and cache updates
 */
export function useBoardActions(boardId?: string) {
  const client = useApolloClient();

  const [createBoard, { loading: createBoardLoading }] = useCreateBoardMutation({
    refetchQueries: [{ query: GET_ALL_BOARDS }],
  });
  const [deleteBoardMutation, { loading: deletingBoard }] = useDeleteBoardMutation(
      {
        refetchQueries: [{ query: GET_ALL_BOARDS }],
      }
  );

  const deleteBoard = useCallback(
    async (id: string) => {
      try {
        await deleteBoardMutation({ variables: { id } });
        return { success: true };
      } catch (error) {
        console.error('Error deleting board:', error);
        return { success: false, error };
      }
    },
    [deleteBoardMutation]
  );

  const [updateBoardMutation, { loading: updatingBoard }] = useUpdateBoardMutation();

  const updateBoard = useCallback(
    async (id: string, data: { title?: string; color?: string; boardIdentifier?: string }) => {
      try {
        const result = await updateBoardMutation({
          variables: { id, data },
          refetchQueries: boardId ? [{ query: GET_BOARD, variables: { id: boardId } }] : [],
        });
        return { success: true, data: result.data };
      } catch (error) {
        console.error('Error updating board:', error);
        return { success: false, error };
      }
    },
    [updateBoardMutation, boardId]
  );

  const [deleteAllListsMutation, { loading: deletingAllLists }] = useDeleteAllListsExceptBacklogMutation();


  const deleteAllLists = useCallback(
    async (id: string, board: Board) => {
      if (!board?.lists) return { success: false, error: 'No board data' };

      const backlogList = board.lists.find((l) => l.position === 0);
      if (!backlogList) return { success: false, error: 'No backlog list found' };

      try {
        const previousState = client.cache.extract();

        const nonBacklogLists = board.lists.filter((l) => l.position !== 0);
        const allMovedCards = nonBacklogLists.flatMap((l) => l.cards);

        client.cache.modify({
          id: client.cache.identify({ __typename: 'ListObject', id: backlogList.id }),
          fields: {
            cards(existingRefs = []) {
              const newRefs = allMovedCards.map((card) =>
                client.cache.writeFragment({
                  data: { __typename: 'CardObject', id: card.id, listId: backlogList.id },
                  fragment: gql`
                    fragment MoveToBacklog on CardObject {
                      id
                      listId
                    }
                  `,
                })
              );
              return [...existingRefs, ...newRefs];
            },
          },
        });

        await deleteAllListsMutation({ variables: { boardId: id } });

        await client.refetchQueries({
          include: [{ query: GET_BOARD, variables: { id } }],
        });

        return { success: true };
      } catch (error) {
        console.error('Error deleting all lists:', error);
        return { success: false, error };
      }
    },
    [deleteAllListsMutation, client]
  );

  const [deleteAllTicketsMutation, { loading: deletingAllTickets }] = useMutation(
    BULK_DELETE_ALL_CARDS_BY_BOARD
  );

  const deleteAllTickets = useCallback(
    async (id: string) => {
      try {
        const previousState = client.cache.extract();

        await deleteAllTicketsMutation({ variables: { boardId: id } });

        await client.refetchQueries({
          include: [{ query: GET_BOARD, variables: { id } }],
        });

        return { success: true };
      } catch (error) {
        console.error('Error deleting all tickets:', error);
        return { success: false, error };
      }
    },
    [deleteAllTicketsMutation, client]
  );

  const [deleteByPriorityMutation, { loading: deletingByPriority }] = useMutation(
    BULK_DELETE_CARDS_BY_PRIORITY
  );

  const deleteTicketsByPriority = useCallback(
    async (priority: string, id: string, listId?: string) => {
      try {
        await deleteByPriorityMutation({
          variables: {
            priority,
            boardId: id,
            listId: listId || undefined,
          },
        });

        await client.refetchQueries({
          include: [{ query: GET_BOARD, variables: { id } }],
        });

        return { success: true };
      } catch (error) {
        console.error('Error deleting tickets by priority:', error);
        return { success: false, error };
      }
    },
    [deleteByPriorityMutation, client]
  );

  return {
    createBoard,
    deleteBoard,
    updateBoard,
    deleteAllLists,
    deleteAllTickets,
    deleteTicketsByPriority,
    createBoardLoading,
    deletingBoard,
    updatingBoard,
    deletingAllLists,
    deletingAllTickets,
    deletingByPriority,
  };
}

