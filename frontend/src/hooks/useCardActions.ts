import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useUserContext } from '../context/UserContext';
import { DELETE_CARD_MUTATION, ASSIGN_USER_MUTATION, GET_BOARD_LISTS, UPDATE_CARD_LIST } from '../helpers/gql/cardGQL';

export interface BoardListItem {
  id: string;
  title: string;
  position: number;
}

interface MoveCardInCacheOptions {
  cardId: string;
  oldListId: string | null;
  targetListId: string;
  listObj?: { id: string; title: string };
  targetListFallback?: { id: string; title: string };
}

/**
 * Shared hook for card actions: assign user, change list, delete.
 * Used by both TaskPage and TicketDetailDialog.
 */
export function useCardActions(cardId: string | undefined, boardId: string | undefined) {
  const client = useApolloClient();
  const { user: currentUser } = useUserContext();

  const { data: listsData } = useQuery(GET_BOARD_LISTS, {
    variables: { boardId },
    skip: !boardId,
  });

  const [updateCardListMut, { loading: updatingList }] = useMutation(UPDATE_CARD_LIST);
  const [deleteCardMut, { loading: deletingCard }] = useMutation(DELETE_CARD_MUTATION);
  const [assignUserMut, { loading: assigningUser }] = useMutation(ASSIGN_USER_MUTATION);

  const boardLists: BoardListItem[] = listsData?.boardLists
    ? [...listsData.boardLists].sort((a: any, b: any) => a.position - b.position)
    : [];

  // ─── Cache helpers ───────────────────────────────────────

  function moveCardInCache({ cardId, oldListId, targetListId, listObj, targetListFallback }: MoveCardInCacheOptions) {
    // Remove from old list
    if (oldListId) {
      client.cache.modify({
        id: client.cache.identify({ __typename: 'ListObject', id: oldListId }),
        fields: {
          cards(existingCardRefs: any[] = [], { readField }) {
            return existingCardRefs.filter((ref) => readField('id', ref) !== cardId);
          },
        },
      });
    }

    // Add to target list
    client.cache.modify({
      id: client.cache.identify({ __typename: 'ListObject', id: targetListId }),
      fields: {
        cards(existingCardRefs: any[] = [], { toReference, readField }) {
          const alreadyInList = existingCardRefs.some((ref) => readField('id', ref) === cardId);
          if (alreadyInList) return existingCardRefs;
          const cardRef = toReference({ __typename: 'CardObject', id: cardId });
          return [...existingCardRefs, cardRef];
        },
      },
    });

    // Update card's listId and list reference
    const listData = listObj || targetListFallback;
    client.cache.modify({
      id: client.cache.identify({ __typename: 'CardObject', id: cardId }),
      fields: {
        listId: () => targetListId,
        ...(listData
          ? {
              list: (_existing: any, { toReference }: any) =>
                toReference({ __typename: 'ListObject', id: targetListId }) || { __typename: 'ListObject', ...listData },
            }
          : {}),
      },
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  const handleAssignMe = async (): Promise<void> => {
    if (!cardId || !currentUser?.id) return;
    try {
      const { data: assignData } = await assignUserMut({
        variables: { cardId, userId: currentUser.id },
      });
      if (assignData?.assignUser) {
        client.cache.modify({
          id: client.cache.identify({ __typename: 'CardObject', id: cardId }),
          fields: {
            userId: () => assignData.assignUser.userId,
            user: () => assignData.assignUser.user,
          },
        });
      }
    } catch (err) {
      console.error('Error assigning user:', err);
    }
  };

  /**
   * Change the list a card belongs to, updating cache for both the card
   * and any release tasks that were moved along with it.
   *
   * Returns the updated card and moved release tasks for callers that
   * need to update local display state (e.g. TicketDetailDialog).
   */
  const handleListChange = async (
    newListId: string,
    currentListId: string,
  ): Promise<{
    updatedCard?: any;
    movedReleaseTasks?: any[];
  }> => {
    if (!cardId || newListId === currentListId) return {};
    try {
      const { data: updateData } = await updateCardListMut({
        variables: { id: cardId, data: { listId: newListId } },
      });
      const result = updateData?.updateCard;
      if (!result?.card) return {};

      const updatedCard = result.card;
      const movedReleaseTasks: { id: string; listId: string; position: number; list?: { id: string; title: string } }[] =
        result.movedReleaseTasks || [];

      const targetListFallback = boardLists.find((l) => l.id === newListId);

      // Move main card in cache
      moveCardInCache({
        cardId: cardId,
        oldListId: currentListId,
        targetListId: newListId,
        listObj: updatedCard.list,
        targetListFallback,
      });

      // Move release tasks in cache
      for (const task of movedReleaseTasks) {
        const cachedTask = client.cache.readFragment<{ listId: string }>({
          id: client.cache.identify({ __typename: 'CardObject', id: task.id }),
          fragment: gql`fragment TaskListId on CardObject { listId }`,
        });
        const oldListId = cachedTask?.listId || null;
        if (oldListId !== task.listId) {
          moveCardInCache({
            cardId: task.id,
            oldListId,
            targetListId: task.listId,
            listObj: task.list,
            targetListFallback,
          });
        }
      }

      return { updatedCard, movedReleaseTasks };
    } catch (err) {
      console.error('Error changing list:', err);
      return {};
    }
  };

  const handleDeleteCard = async (): Promise<boolean> => {
    if (!cardId) return false;
    try {
      await deleteCardMut({ variables: { id: cardId } });

      // Evict the deleted card from cache
      client.cache.evict({ id: client.cache.identify({ __typename: 'CardObject', id: cardId }) });
      // Evict board so BoardPage refreshes list counts
      if (boardId) {
        client.cache.evict({ id: `BoardObject:${boardId}` });
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'board', args: { id: boardId } });
      }
      client.cache.gc();
      return true;
    } catch (err) {
      console.error('Error deleting card:', err);
      return false;
    }
  };

  return {
    currentUser,
    boardLists,
    updatingList,
    deletingCard,
    assigningUser,
    handleAssignMe,
    handleListChange,
    handleDeleteCard,
  };
}

