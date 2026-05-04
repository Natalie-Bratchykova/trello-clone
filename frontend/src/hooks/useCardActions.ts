import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useUserContext } from '../context/UserContext';
import {
  DELETE_CARD_MUTATION,
  ASSIGN_USER_MUTATION,
  GET_BOARD_LISTS,
  UPDATE_CARD_LIST,
  CREATE_CARD_MUTATION, UPDATE_CARD_MUTATION
} from '../helpers/gql/cardGQL';
import {MOVE_TICKET} from "../helpers/gql/boardGQL.ts";

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
  const [createCardMut, { loading: creatingCard }] = useMutation(CREATE_CARD_MUTATION);
  const [updateCardMut, { loading: updatingCard }] = useMutation(UPDATE_CARD_MUTATION);
  const [moveCardMut, { loading: movingCard }] = useMutation(MOVE_TICKET);

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

  const createCard = async (input: CreateCardInput): Promise<{ success: boolean; data?: any; error?: any }> => {
    try {
      const result = await createCardMut({
        variables: { ...input },
        refetchQueries: boardId ? [{ query: GET_BOARD, variables: { id: boardId } }] : [],
      });
      return { success: true, data: result.data?.createCard };
    } catch (error) {
      console.error('Error creating card:', error);
      return { success: false, error };
    }
  };

  const updateCard = async (id: string, data: UpdateCardInput): Promise<{ success: boolean; data?: any; error?: any }> => {
    if (!id) return { success: false, error: 'No card ID provided' };
    try {
      const result = await updateCardMut({
        variables: { id, data },
      });
      return { success: true, data: result.data?.updateCard };
    } catch (error) {
      console.error('Error updating card:', error);
      return { success: false, error };
    }
  };

  const moveCard = async (
    targetCardId: string,
    targetListId: string,
    position: number,
    board?: Board,
    optimistic: boolean = true
  ): Promise<{ success: boolean; data?: any; error?: any }> => {
    try {
      const result = await moveCardMut({
        variables: { data: { cardId: targetCardId, targetListId, position } },
        optimisticResponse: optimistic
          ? {
              moveCard: {
                __typename: 'MoveCardResult',
                card: {
                  __typename: 'CardObject',
                  id: targetCardId,
                  listId: targetListId,
                  position,
                },
                movedReleaseTasks: [],
              },
            }
          : undefined,
        update: (cache, { data }) => {
          const result = data?.moveCard;
          if (!result || !board?.lists) return;

          const movedCard = result.card;
          const movedReleaseTasks = result.movedReleaseTasks || [];

          // Helper to move a single card in cache
          const moveCardInCacheLocal = (
            cId: string,
            tListId: string,
            pos: number,
            listObj?: { id: string; title: string }
          ) => {
            const sourceList = board.lists.find((list) => list.cards.some((c) => c.id === cId));
            if (!sourceList) return;

            // Remove from source list
            cache.modify({
              id: cache.identify({ __typename: 'ListObject', id: sourceList.id }),
              fields: {
                cards(existingCardRefs: readonly any[] = [], { readField }) {
                  return existingCardRefs.filter((ref) => readField('id', ref) !== cId);
                },
              },
            });

            // Add to target list
            cache.modify({
              id: cache.identify({ __typename: 'ListObject', id: tListId }),
              fields: {
                cards(existingCardRefs: readonly any[] = [], { readField, toReference }) {
                  const alreadyInList = existingCardRefs.some((ref) => readField('id', ref) === cId);
                  if (alreadyInList) return existingCardRefs;

                  const cardRef =
                    toReference({ __typename: 'CardObject', id: cId }) ??
                    cache.writeFragment({
                      data: { __typename: 'CardObject', id: cId },
                      fragment: gql`
                        fragment MinimalCard on CardObject {
                          id
                        }
                      `,
                    });

                  const insertAt = Math.max(0, Math.min(pos ?? existingCardRefs.length, existingCardRefs.length));
                  const mutableRefs = [...existingCardRefs];
                  return [...mutableRefs.slice(0, insertAt), cardRef, ...mutableRefs.slice(insertAt)];
                },
              },
            });

            // Update card fields
            const targetListData = listObj || board.lists.find((l) => l.id === tListId);
            cache.modify({
              id: cache.identify({ __typename: 'CardObject', id: cId }),
              fields: {
                listId: () => tListId,
                position: () => pos,
                ...(targetListData
                  ? {
                      list: (_existing: any, { toReference }: any) =>
                        toReference({ __typename: 'ListObject', id: tListId }) || {
                          __typename: 'ListObject',
                          id: tListId,
                          title: targetListData.title,
                        },
                    }
                  : {}),
              },
            });
          };

          // Move main card
          moveCardInCacheLocal(movedCard.id, movedCard.listId, movedCard.position);

          // Move related release tasks
          for (const task of movedReleaseTasks) {
            moveCardInCacheLocal(task.id, task.listId, task.position, task.list);
          }
        },
      });

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error moving card:', error);
      return { success: false, error };
    }
  };

  const moveMultipleCards = async (cards: Card[], targetListId: string, board?: Board): Promise<{ success: boolean; error?: any }> => {
    try {
      const backlogCardCount = board?.lists.find((l) => l.id === targetListId)?.cards.length || 0;

      await Promise.all(
        cards.map((card, index) =>
          moveCardMut({
            variables: {
              data: {
                cardId: card.id,
                targetListId,
                position: backlogCardCount + index,
              },
            },
          })
        )
      );

      // Refetch board after bulk move
      if (boardId) {
        await client.refetchQueries({
          include: [{ query: GET_BOARD, variables: { id: boardId } }],
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error moving multiple cards:', error);
      return { success: false, error };
    }
  };

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
    // User info
    currentUser,
    boardLists,

    // Loading states
    updatingList,
    deletingCard,
    assigningUser,
    creatingCard,
    updatingCard,
    movingCard,

    // Actions (original - for backward compatibility)
    handleAssignMe,
    handleListChange,
    handleDeleteCard,

    // New comprehensive actions
    createCard,
    updateCard,
    moveCard,
    moveMultipleCards,
  };
}

