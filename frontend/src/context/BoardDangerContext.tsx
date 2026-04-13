import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Board } from '../helpers/types/BoardTypes';
import {
  useBulkDeleteAllCardsByBoardMutation,
  useBulkDeleteCardsByPriorityMutation, useDeleteAllListsExceptBacklogMutation
} from "../generated/graphql.ts";

export interface BoardDangerContextType {
  // Dialog open states
  deleteAllConfirmOpen: boolean;
  setDeleteAllConfirmOpen: (v: boolean) => void;
  deleteAllTicketsBoardOpen: boolean;
  setDeleteAllTicketsBoardOpen: (v: boolean) => void;
  deletePriorityBoardOpen: boolean;
  setDeletePriorityBoardOpen: (v: boolean) => void;

  // Menu anchors
  dangerMenuAnchor: HTMLElement | null;
  setDangerMenuAnchor: (el: HTMLElement | null) => void;
  boardPrioritySubmenuAnchor: HTMLElement | null;
  setBoardPrioritySubmenuAnchor: (el: HTMLElement | null) => void;

  // Board priority selection
  selectedBoardPriorities: string[];
  setSelectedBoardPriorities: (v: string[]) => void;
  toggleBoardPriority: (p: string) => void;
  boardPriorityMatchCount: number;

  // Handlers
  handleDeleteAllLists: () => Promise<void>;
  handleDeleteAllTicketsBoard: () => Promise<void>;
  handleDeleteByPriorityBoard: () => Promise<void>;

  // Loading states
  deletingAllLists: boolean;
  deletingAllTicketsBoard: boolean;
  deletingPriorityBoard: boolean;
}

const BoardDangerContext = createContext<BoardDangerContextType | null>(null);

export function useBoardDanger(): BoardDangerContextType {
  const ctx = useContext(BoardDangerContext);
  if (!ctx) {
    throw new Error('useBoardDanger must be used within a BoardDangerProvider');
  }
  return ctx;
}

interface BoardDangerProviderProps {
  board: Board;
  boardId: string;
  children: ReactNode;
}

export function BoardDangerProvider({ board, boardId, children }: BoardDangerProviderProps) {

  // Dialog open states
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deleteAllTicketsBoardOpen, setDeleteAllTicketsBoardOpen] = useState(false);
  const [deletePriorityBoardOpen, setDeletePriorityBoardOpen] = useState(false);

  // Menu anchors
  const [dangerMenuAnchor, setDangerMenuAnchor] = useState<HTMLElement | null>(null);
  const [boardPrioritySubmenuAnchor, setBoardPrioritySubmenuAnchor] = useState<HTMLElement | null>(null);

  // Board priority selection
  const [selectedBoardPriorities, setSelectedBoardPriorities] = useState<string[]>([]);

  const toggleBoardPriority = useCallback((p: string) => {
    setSelectedBoardPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

  const boardPriorityMatchCount = useMemo(() => {
    if (!board?.lists) return 0;
    return board.lists.reduce(
      (sum, list) =>
        sum + list.cards.filter((c) => selectedBoardPriorities.includes(c.priority || '')).length,
      0,
    );
  }, [board, selectedBoardPriorities]);

  // --- Mutations ---

  const [deleteAllLists, { loading: deletingAllLists }] = useDeleteAllListsExceptBacklogMutation();

  const handleDeleteAllLists = useCallback(async () => {
    if (!board?.lists || !boardId) return;

    const backlogList = board.lists.find((l) => l.position === 0);
    if (!backlogList) return;

    const nonBacklogLists = board.lists.filter((l) => l.position !== 0);
    if (nonBacklogLists.length === 0) return;

    const allMovedCards = nonBacklogLists.flatMap((l) => l.cards);

    try {
      // @ts-ignore
      await deleteAllLists({
        variables: { boardId },
        update(cache) {
          const backlogCardCount = backlogList.cards.length;

          cache.modify({
            id: cache.identify({ __typename: 'ListObject', id: backlogList.id }),
            fields: {
              cards(existingCardRefs: any[] = [], { toReference }) {
                const newRefs = allMovedCards
                  .map((card, index) => {
                    cache.modify({
                      id: cache.identify({ __typename: 'CardObject', id: card.id }),
                      fields: {
                        listId() { return backlogList.id; },
                        position() { return backlogCardCount + index; },
                      },
                    });
                    return toReference({ __typename: 'CardObject', id: card.id });
                  })
                  .filter(Boolean);
                return [...existingCardRefs, ...newRefs];
              },
            },
          });

          cache.modify({
            id: cache.identify({ __typename: 'BoardObject', id: boardId }),
            fields: {
              lists(existingListRefs: any[] = [], { readField }) {
                return existingListRefs.filter((ref) => {
                  const listId = readField('id', ref);
                  return listId === backlogList.id;
                });
              },
            },
          });

          for (const list of nonBacklogLists) {
            cache.evict({ id: cache.identify({ __typename: 'ListObject', id: list.id }) });
          }
          cache.gc();
        },
      });
      setDeleteAllConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting all lists:', err);
    }
  }, [board, boardId, deleteAllLists]);

  const [bulkDeleteAllBoard, { loading: deletingAllTicketsBoard }] = useBulkDeleteAllCardsByBoardMutation();

  const handleDeleteAllTicketsBoard = useCallback(async () => {
    if (!board?.lists || !boardId) return;
    try {
      // @ts-ignore
      await bulkDeleteAllBoard({
        variables: { boardId },
        update(cache, { data }) {
          const deletedIds: string[] = data?.bulkDeleteAllCardsByBoard ?? [];
          for (const cardId of deletedIds) {
            cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
          }
          for (const list of board.lists) {
            cache.modify({
              id: cache.identify({ __typename: 'ListObject', id: list.id }),
              fields: { cards() { return []; } },
            });
          }
          cache.gc();
        },
      });
      setDeleteAllTicketsBoardOpen(false);
    } catch (err) {
      console.error('Error deleting all tickets on board:', err);
    }
  }, [board, boardId, bulkDeleteAllBoard]);

  const [bulkDeleteByPriorityBoard, { loading: deletingPriorityBoard }] = useBulkDeleteCardsByPriorityMutation();

  const handleDeleteByPriorityBoard = useCallback(async () => {
    if (!board?.lists || !boardId || selectedBoardPriorities.length === 0) return;
    try {
      for (const priority of selectedBoardPriorities) {
        // @ts-ignore
        await bulkDeleteByPriorityBoard({
          variables: { priority, boardId },
          update(cache, { data }) {
            const deletedIds: string[] = data?.bulkDeleteCardsByPriority ?? [];
            for (const cardId of deletedIds) {
              cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
            }
            for (const list of board!.lists) {
              cache.modify({
                id: cache.identify({ __typename: 'ListObject', id: list.id }),
                fields: {
                  cards(existingRefs: any[] = [], { readField }) {
                    return existingRefs.filter(
                      (ref) => !deletedIds.includes(readField('id', ref) as string),
                    );
                  },
                },
              });
            }
            cache.gc();
          },
        });
      }
      setDeletePriorityBoardOpen(false);
      setSelectedBoardPriorities([]);
    } catch (err) {
      console.error('Error deleting by priority on board:', err);
    }
  }, [board, boardId, selectedBoardPriorities, bulkDeleteByPriorityBoard]);

  const value = useMemo<BoardDangerContextType>(
    () => ({
      deleteAllConfirmOpen,
      setDeleteAllConfirmOpen,
      deleteAllTicketsBoardOpen,
      setDeleteAllTicketsBoardOpen,
      deletePriorityBoardOpen,
      setDeletePriorityBoardOpen,
      dangerMenuAnchor,
      setDangerMenuAnchor,
      boardPrioritySubmenuAnchor,
      setBoardPrioritySubmenuAnchor,
      selectedBoardPriorities,
      setSelectedBoardPriorities,
      toggleBoardPriority,
      boardPriorityMatchCount,
      handleDeleteAllLists,
      handleDeleteAllTicketsBoard,
      handleDeleteByPriorityBoard,
      deletingAllLists,
      deletingAllTicketsBoard,
      deletingPriorityBoard,
    }),
    [
      deleteAllConfirmOpen, deleteAllTicketsBoardOpen, deletePriorityBoardOpen,
      dangerMenuAnchor, boardPrioritySubmenuAnchor,
      selectedBoardPriorities, boardPriorityMatchCount,
      handleDeleteAllLists, handleDeleteAllTicketsBoard, handleDeleteByPriorityBoard,
      deletingAllLists, deletingAllTicketsBoard, deletingPriorityBoard,
      toggleBoardPriority,
    ],
  );

  return (
    <BoardDangerContext.Provider value={value}>
      {children}
    </BoardDangerContext.Provider>
  );
}



