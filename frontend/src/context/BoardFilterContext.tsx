import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Board, Card, List } from '../helpers/types/BoardTypes';
import type { SortDirection, SortField, PrioritySortMode } from '../helpers/utils/sortHelper';
import { PRIORITY_SORT_ORDERS } from '../helpers/utils/sortHelper';

export interface BoardUser {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
}

export interface BoardFilterContextType {
  // Board data
  board: Board | null;
  currentUser: { id?: string; name?: string; email?: string };

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Filters
  showOnlyMine: boolean;
  setShowOnlyMine: (v: boolean) => void;
  selectedUsers: string[];
  toggleUser: (uid: string) => void;
  selectedPriorities: string[];
  togglePriority: (p: string) => void;

  // Sort
  sortBy: SortField;
  setSortBy: (f: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (d: SortDirection | ((prev: SortDirection) => SortDirection)) => void;
  prioritySortMode: PrioritySortMode;
  setPrioritySortMode: (m: PrioritySortMode) => void;

  // Derived
  allBoardUsers: BoardUser[];
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  totalCardCount: number;
  filteredCardCount: number;
  filteredLists: List[];

  // Actions
  clearFilters: () => void;
  filterCard: (card: Card) => boolean;
  sortCards: (cards: Card[]) => Card[];
}

const BoardFilterContext = createContext<BoardFilterContextType | null>(null);

export function useBoardFilter(): BoardFilterContextType {
  const ctx = useContext(BoardFilterContext);
  if (!ctx) {
    throw new Error('useBoardFilter must be used within a BoardFilterProvider');
  }
  return ctx;
}

interface BoardFilterProviderProps {
  board: Board | null;
  children: ReactNode;
}

export function BoardFilterProvider({ board, children }: BoardFilterProviderProps) {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Sort
  const [sortBy, setSortBy] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [prioritySortMode, setPrioritySortMode] = useState<PrioritySortMode>('low-medium-high');

  // Derived: unique users
  const allBoardUsers = useMemo<BoardUser[]>(() => {
    if (!board?.lists) return [];
    const userMap = new Map<string, BoardUser>();
    board.lists.forEach((list) =>
      list.cards.forEach((card) => {
        if (card.user) {
          userMap.set(card.user.id, card.user);
        }
      }),
    );
    return Array.from(userMap.values());
  }, [board]);

  const totalCardCount = useMemo(() => {
    if (!board?.lists) return 0;
    return board.lists.reduce((sum, list) => sum + list.cards.length, 0);
  }, [board]);

  const hasActiveFilters = searchQuery.trim() !== '' || showOnlyMine || selectedUsers.length > 0 || selectedPriorities.length > 0 || sortBy !== 'none';

  const activeFiltersCount = selectedUsers.length + selectedPriorities.length + (showOnlyMine ? 1 : 0) + (sortBy !== 'none' ? 1 : 0);

  const toggleUser = useCallback((uid: string) => {
    setSelectedUsers((prev) => (prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]));
  }, []);

  const togglePriority = useCallback((p: string) => {
    setSelectedPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setShowOnlyMine(false);
    setSelectedUsers([]);
    setSelectedPriorities([]);
    setSortBy('none');
    setSortDirection('desc');
  }, []);

  const filterCard = useCallback(
    (card: Card): boolean => {
      if (showOnlyMine && currentUser?.id && card.user?.id !== currentUser.id) return false;
      if (selectedUsers.length > 0 && (!card.user || !selectedUsers.includes(card.user.id))) return false;
      if (selectedPriorities.length > 0 && (!card.priority || !selectedPriorities.includes(card.priority))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchSuffix = (card.suffix || '').toLowerCase().includes(q);
        const matchDesc = (card.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSuffix && !matchDesc) return false;
      }
      return true;
    },
    [showOnlyMine, currentUser?.id, selectedUsers, selectedPriorities, searchQuery],
  );

  const sortCards = useCallback(
    (cards: Card[]): Card[] => {
      if (sortBy === 'none') return cards;
      const sorted = [...cards].sort((a, b) => {
        switch (sortBy) {
          case 'priority': {
            const order = PRIORITY_SORT_ORDERS[prioritySortMode];
            const pa = order[a.priority || ''] ?? 99;
            const pb = order[b.priority || ''] ?? 99;
            return pa - pb;
          }
          case 'createdAt': {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const cmp = da - db;
            return sortDirection === 'asc' ? cmp : -cmp;
          }
          case 'dueDate': {
            const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            const cmp = da - db;
            return sortDirection === 'asc' ? cmp : -cmp;
          }
          default:
            return 0;
        }
      });
      return sorted;
    },
    [sortBy, sortDirection, prioritySortMode],
  );

  const filteredLists = useMemo(() => {
    if (!board?.lists) return [];
    const needsFilter = searchQuery.trim() !== '' || showOnlyMine || selectedUsers.length > 0 || selectedPriorities.length > 0;
    const needsSort = sortBy !== 'none';
    if (!needsFilter && !needsSort) return board.lists;
    return board.lists.map((list) => {
      let cards = needsFilter ? list.cards.filter(filterCard) : [...list.cards];
      if (needsSort) cards = sortCards(cards);
      return { ...list, cards };
    });
  }, [board, filterCard, sortCards, searchQuery, showOnlyMine, selectedUsers, selectedPriorities, sortBy, sortDirection, prioritySortMode]);

  const filteredCardCount = useMemo(() => {
    return filteredLists.reduce((sum, list) => sum + list.cards.length, 0);
  }, [filteredLists]);

  const value = useMemo<BoardFilterContextType>(
    () => ({
      board,
      currentUser,
      searchQuery,
      setSearchQuery,
      showOnlyMine,
      setShowOnlyMine,
      selectedUsers,
      toggleUser,
      selectedPriorities,
      togglePriority,
      sortBy,
      setSortBy,
      sortDirection,
      setSortDirection,
      prioritySortMode,
      setPrioritySortMode,
      allBoardUsers,
      hasActiveFilters,
      activeFiltersCount,
      totalCardCount,
      filteredCardCount,
      filteredLists,
      clearFilters,
      filterCard,
      sortCards,
    }),
    [
      board, currentUser, searchQuery, showOnlyMine, selectedUsers, selectedPriorities,
      sortBy, sortDirection, prioritySortMode, allBoardUsers, hasActiveFilters,
      activeFiltersCount, totalCardCount, filteredCardCount, filteredLists,
      clearFilters, filterCard, sortCards, toggleUser, togglePriority,
    ],
  );

  return (
    <BoardFilterContext.Provider value={value}>
      {children}
    </BoardFilterContext.Provider>
  );
}

export default BoardFilterContext;

