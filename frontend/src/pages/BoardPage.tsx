import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
  Chip,
  List as MuiList,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Settings,
  Search,
  Person,
  Flag,
  FilterList,
  FolderSpecial,
  ViewColumn,
  PersonOutline,
  SwapVert,
  ArrowUpward,
  ArrowDownward,
  DeleteSweep,
  Warning,
  DeleteForever,
} from '@mui/icons-material';
import CreateCardDialog from '../components/CreateCardDialog';
import TicketDetailDialog from '../components/TicketDetailDialog';
import { GET_BOARD, MOVE_TICKET, DELETE_ALL_LISTS_EXCEPT_BACKLOG, BULK_DELETE_ALL_CARDS_BY_BOARD, BULK_DELETE_CARDS_BY_PRIORITY } from '../helpers/gql/boardGQL';
import BoardColumn from '../components/BoardColumn.tsx';
import { gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {PRIORITY_OPTIONS} from "../helpers/utils/color.ts";
import type {List, Card, Board} from "../helpers/types/BoardTypes.ts";
import {CREATE_LIST_MUTATION} from '../helpers/gql/listGQL.ts';


import {PRIORITY_SORT_ORDERS, PRIORITY_SORT_MODES, SORT_OPTIONS} from "../helpers/utils/sortHelper.ts";
import type { SortDirection, SortField} from '../helpers/utils/sortHelper.ts';
import FilterItem from "../components/Filter/FilterItem.tsx";
import FilterSideBar from "../components/Filter/FilterSideBar.tsx";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [cardDialogState, setCardDialogState] = useState<{
    open: boolean;
    listId: string;
    listTitle: string;
  }>({
    open: false,
    listId: '',
    listTitle: '',
  });
  const [selectedCard, setSelectedCard] = useState<{ card: Card; listTitle: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [prioritySortMode, setPrioritySortMode] = useState<PrioritySortMode>('low-medium-high');
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [dangerMenuAnchor, setDangerMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteAllTicketsBoardOpen, setDeleteAllTicketsBoardOpen] = useState(false);
  const [deletePriorityBoardOpen, setDeletePriorityBoardOpen] = useState(false);
  const [boardPrioritySubmenuAnchor, setBoardPrioritySubmenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedBoardPriorities, setSelectedBoardPriorities] = useState<string[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { loading, error, data, refetch } = useQuery<{ board: Board }>(GET_BOARD, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const board = data?.board ?? null;

  // Extract unique users from all cards on this board
  const allBoardUsers = useMemo(() => {
    if (!board?.lists) return [];
    const userMap = new Map<string, { id: string; name: string; email?: string; profileImage?: string }>();
    board.lists.forEach((list) =>
      list.cards.forEach((card) => {
        if (card.user) {
          userMap.set(card.user.id, card.user);
        }
      }),
    );
    return Array.from(userMap.values());
  }, [board]);

  // Count cards for current user

  const totalCardCount = useMemo(() => {
    if (!board?.lists) return 0;
    return board.lists.reduce((sum, list) => sum + list.cards.length, 0);
  }, [board]);

  // Filter cards in each list
  const hasActiveFilters = searchQuery.trim() !== '' || showOnlyMine || selectedUsers.length > 0 || selectedPriorities.length > 0 || sortBy !== 'none';

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
            return pa - pb; // Mode itself defines the full order, no direction flip
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

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) => (prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]));
  };
  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };
  const clearFilters = () => {
    setSearchQuery('');
    setShowOnlyMine(false);
    setSelectedUsers([]);
    setSelectedPriorities([]);
    setSortBy('none');
    setSortDirection('desc');
  };

  const activeFiltersCount = selectedUsers.length + selectedPriorities.length + (showOnlyMine ? 1 : 0) + (sortBy !== 'none' ? 1 : 0);

  const [createList, { loading: createListLoading }] = useMutation(CREATE_LIST_MUTATION, {
    onCompleted: () => {
      setNewListTitle('');
      setIsAddingList(false);
      refetch();
    },
  });

  const [moveTicket] = useMutation(MOVE_TICKET, {
    onError: (err) => console.error(err),
    update(cache, { data }) {
      const result = data?.moveCard;
      if (!result || !board?.lists) return;

      const movedCard = result.card;
      const movedReleaseTasks: { id: string; listId: string; position: number; list?: { id: string; title: string } }[] = result.movedReleaseTasks || [];

      // Helper to move a single card in the cache
      const moveCardInCache = (cardId: string, targetListId: string, position: number, listObj?: { id: string; title: string }) => {
        const sourceList = board.lists.find((list) => list.cards.some((c) => c.id === cardId));
        if (!sourceList) return;

        // Remove from source list
        cache.modify({
          id: cache.identify({ __typename: 'ListObject', id: sourceList.id }),
          fields: {
            cards(existingCardRefs: any[] = [], { readField }) {
              return existingCardRefs.filter((ref) => readField('id', ref) !== cardId);
            },
          },
        });

        // Add to target list
        cache.modify({
          id: cache.identify({ __typename: 'ListObject', id: targetListId }),
          fields: {
            cards(existingCardRefs: any[] = [], { readField, toReference }) {
              const alreadyInList = existingCardRefs.some((ref) => readField('id', ref) === cardId);
              const cardRef =
                toReference({ __typename: 'CardObject', id: cardId }) ??
                cache.writeFragment({
                  data: { __typename: 'CardObject', id: cardId },
                  fragment: gql`
                    fragment MinimalCard on CardObject {
                      id
                    }
                  `,
                });

              if (alreadyInList) return existingCardRefs;

              const insertAt = Math.max(0, Math.min(position ?? existingCardRefs.length, existingCardRefs.length));
              return [
                ...existingCardRefs.slice(0, insertAt),
                cardRef,
                ...existingCardRefs.slice(insertAt),
              ];
            },
          },
        });

        // Update the card's own fields including list reference
        const targetListData = listObj || board.lists.find((l) => l.id === targetListId);
        cache.modify({
          id: cache.identify({ __typename: 'CardObject', id: cardId }),
          fields: {
            listId() {
              return targetListId;
            },
            position() {
              return position;
            },
            ...(targetListData
              ? {
                  list(_existing: any, { toReference }: any) {
                    return toReference({ __typename: 'ListObject', id: targetListId }) || { __typename: 'ListObject', id: targetListId, title: targetListData.title };
                  },
                }
              : {}),
          },
        });
      };

      // Move the main card
      moveCardInCache(movedCard.id, movedCard.listId, movedCard.position);

      // Move all release-linked tasks
      for (const task of movedReleaseTasks) {
        moveCardInCache(task.id, task.listId, task.position, task.list);
      }
    },
  });

  const handleTicketsDnD = useCallback(
    (item: Card & { listId: string }, targetList: List) => {
      const sourceListId = item.listId;
      if (sourceListId === targetList.id) return;

      const position = targetList.cards.length;

      moveTicket({
        variables: { data: { cardId: item.id, targetListId: targetList.id, position } },
        optimisticResponse: {
          moveCard: {
            __typename: 'MoveCardResult',
            card: {
              __typename: 'CardObject',
              id: item.id,
              listId: targetList.id,
              position,
            },
            movedReleaseTasks: [],
          },
        },
      });
    },
    [moveTicket],
  );

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !id) return;

    try {
      await createList({
        variables: {
          title: newListTitle.trim(),
          boardId: id,
        },
      });
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleClearList = useCallback(
    async (_listId: string, cards: Card[]) => {
      if (!board?.lists) return;
      const backlogList = board.lists.find((l) => l.position === 0);
      if (!backlogList) return;

      const backlogCardCount = backlogList.cards.length;

      await Promise.all(
        cards.map((card, index) =>
          moveTicket({
            variables: {
              data: {
                cardId: card.id,
                targetListId: backlogList.id,
                position: backlogCardCount + index,
              },
            },
            optimisticResponse: {
              moveCard: {
                __typename: 'MoveCardResult',
                card: {
                  __typename: 'CardObject',
                  id: card.id,
                  listId: backlogList.id,
                  position: backlogCardCount + index,
                },
                movedReleaseTasks: [],
              },
            },
          }),
        ),
      );
    },
    [board, moveTicket],
  );

  const [deleteAllLists, { loading: deletingAllLists }] = useMutation(DELETE_ALL_LISTS_EXCEPT_BACKLOG);

  const handleDeleteAllLists = useCallback(async () => {
    if (!board?.lists || !id) return;

    const backlogList = board.lists.find((l) => l.position === 0);
    if (!backlogList) return;

    const nonBacklogLists = board.lists.filter((l) => l.position !== 0);
    if (nonBacklogLists.length === 0) return;

    // Collect all cards from non-backlog lists
    const allMovedCards = nonBacklogLists.flatMap((l) => l.cards);

    try {
      await deleteAllLists({
        variables: { boardId: id },
        update(cache) {
          // Move all cards refs to backlog in cache
          const backlogCardCount = backlogList.cards.length;

          cache.modify({
            id: cache.identify({ __typename: 'ListObject', id: backlogList.id }),
            fields: {
              cards(existingCardRefs: any[] = [], { toReference }) {
                const newRefs = allMovedCards.map((card, index) => {
                  // Update each card's listId in cache
                  cache.modify({
                    id: cache.identify({ __typename: 'CardObject', id: card.id }),
                    fields: {
                      listId() { return backlogList.id; },
                      position() { return backlogCardCount + index; },
                    },
                  });
                  return toReference({ __typename: 'CardObject', id: card.id });
                }).filter(Boolean);
                return [...existingCardRefs, ...newRefs];
              },
            },
          });

          // Remove non-backlog lists from the board in cache
          cache.modify({
            id: cache.identify({ __typename: 'BoardObject', id }),
            fields: {
              lists(existingListRefs: any[] = [], { readField }) {
                return existingListRefs.filter((ref) => {
                  const listId = readField('id', ref);
                  return listId === backlogList.id;
                });
              },
            },
          });

          // Evict deleted lists from cache
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
  }, [board, id, deleteAllLists]);

  // Board-wide: delete all tickets
  const [bulkDeleteAllBoard, { loading: deletingAllTicketsBoard }] = useMutation(BULK_DELETE_ALL_CARDS_BY_BOARD);

  const handleDeleteAllTicketsBoard = useCallback(async () => {
    if (!board?.lists || !id) return;
    try {
      await bulkDeleteAllBoard({
        variables: { boardId: id },
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
  }, [board, id, bulkDeleteAllBoard]);

  // Board-wide: delete by priority
  const [bulkDeleteByPriorityBoard, { loading: deletingPriorityBoard }] = useMutation(BULK_DELETE_CARDS_BY_PRIORITY);

  const handleDeleteByPriorityBoard = useCallback(async () => {
    if (!board?.lists || !id || selectedBoardPriorities.length === 0) return;
    try {
      for (const priority of selectedBoardPriorities) {
        await bulkDeleteByPriorityBoard({
          variables: { priority, boardId: id },
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
                    return existingRefs.filter((ref) => !deletedIds.includes(readField('id', ref) as string));
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
  }, [board, id, selectedBoardPriorities, bulkDeleteByPriorityBoard]);

  const toggleBoardPriority = (p: string) => {
    setSelectedBoardPriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const boardPriorityMatchCount = useMemo(() => {
    if (!board?.lists) return 0;
    return board.lists.reduce(
      (sum, list) => sum + list.cards.filter((c) => selectedBoardPriorities.includes(c.priority || '')).length,
      0,
    );
  }, [board, selectedBoardPriorities]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !board) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error ? `${t('common.error')}: ${error.message}` : t('board.boardNotFound')}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          {t('board.backToProjects')}
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ backgroundColor: board.color, color: 'white', py: 2, px: 3 }}>
        <Container maxWidth={false}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => history.back()} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
              {board.title}
            </Typography>
            <IconButton onClick={() => navigate(`/board/${id}/edit`)} sx={{ color: 'white' }} title={t('board.projectSettings')}>
              <Settings />
            </IconButton>
            <IconButton
              onClick={(e) => setDangerMenuAnchor(e.currentTarget)}
              sx={{ color: 'white' }}
              title={t('board.dangerActions')}
            >
              <DeleteSweep />
            </IconButton>
            <Menu
              anchorEl={dangerMenuAnchor}
              open={Boolean(dangerMenuAnchor)}
              onClose={() => setDangerMenuAnchor(null)}
            >
              {board.lists.filter((l) => l.position !== 0).length > 0 && (
                <MenuItem
                  onClick={() => { setDangerMenuAnchor(null); setDeleteAllConfirmOpen(true); }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon><DeleteSweep fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>{t('danger.deleteAllLists')}</ListItemText>
                </MenuItem>
              )}
              {totalCardCount > 0 && (
                <MenuItem
                  onClick={() => { setDangerMenuAnchor(null); setDeleteAllTicketsBoardOpen(true); }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon><DeleteForever fontSize="small" color="error" /></ListItemIcon>
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
                  <ListItemIcon><Flag fontSize="small" color="error" /></ListItemIcon>
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
              <Typography variant="caption" sx={{ px: 2, py: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                {t('danger.selectPrioritiesForDeletion')}
              </Typography>
              {PRIORITY_OPTIONS.map((opt) => {
                const count = board.lists.reduce(
                  (sum, l) => sum + l.cards.filter((c) => (c.priority || '') === opt[0]).length,
                  0,
                );
                return (
                  <MenuItem key={opt[0]} onClick={() => toggleBoardPriority(opt[0])} dense>
                    <Checkbox size="small" checked={selectedBoardPriorities.includes(opt[0])} sx={{ p: 0, mr: 1 }} />
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
          </Box>
        </Container>
      </Box>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <FilterSideBar
            board={board}
            hasActiveFilters={hasActiveFilters}
            showOnlyMine={showOnlyMine}
            setShowOnlyMine={setShowOnlyMine}
            currentUser={currentUser}
            activeFiltersCount={activeFiltersCount}
            selectedPriorities={selectedPriorities}
            toggleUser={toggleUser}
            togglePriority={togglePriority}
            allBoardUsers={allBoardUsers}
            sortBy={sortBy}
            filteredCardCount={filteredCardCount}
            totalCardCount={totalCardCount}
            selectedUsers={selectedUsers}
        />

        {/* Main board area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search + filter bar */}
          <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <TextField
              size="small"
              placeholder={t('filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200, flex: { xs: 1, sm: 'unset' } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Users filter dropdown */}
            <FilterItem
                filterTitle={'filters.assignees'}
                filterSubtitle={'filters.noAssignees'}
                selectedItems={selectedUsers}
                setItemAnchor={setUserMenuAnchor}
                isUserFilter={true}
                itemAnchor={userMenuAnchor}
                results={allBoardUsers}
                toggleState={toggleUser}
                renderItem={(user) => (
                    <>
                      <Avatar
                          sx={{ width: 24, height: 24, fontSize: '0.7rem', mr: 1 }}
                          src={user.profileImage ? `http://localhost:3000${user.profileImage}` : undefined}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <ListItemText primary={user.name} primaryTypographyProps={{ variant: 'body2' }} />
                    </>
                )}
            />

            {/* Priority filter dropdown */}
            <FilterItem
                filterTitle={'filters.priorityFilter'}
                filterSubtitle={''}
                selectedItems={selectedPriorities}
                setItemAnchor={setPriorityMenuAnchor}
                isUserFilter={false}
                itemAnchor={priorityMenuAnchor}
                results={PRIORITY_OPTIONS}
                toggleState={togglePriority}
                renderItem={(opt) => (
                    <>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: opt.color, mr: 1 }} />
                      <ListItemText primary={`${opt[1].icon} ${t(opt[1].labelKey)}`} primaryTypographyProps={{ variant: 'body2' }} />
                    </>
                )}
            />

            {/* Sort dropdown */}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Button
              variant={sortBy !== 'none' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<SwapVert sx={{ fontSize: 16 }} />}
              endIcon={
                sortBy !== 'none' ? (
                  sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />
                ) : undefined
              }
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              sx={{ textTransform: 'none', fontSize: '0.8rem' }}
            >
              {sortBy === 'priority'
                ? `${t('filters.priorityFilter')}: ${PRIORITY_SORT_LABELS[prioritySortMode]}`
                : sortBy !== 'none'
                  ? t(SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey || '')
                  : t('sort.title')}
            </Button>
            <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)}>
              {SORT_OPTIONS.map((opt) => (
                <MenuItem
                  key={opt.value}
                  selected={sortBy === opt.value}
                  onClick={() => {
                    if (opt.value === 'none') {
                      setSortBy('none');
                      setSortMenuAnchor(null);
                    } else if (opt.value === 'priority') {
                      setSortBy('priority');
                      // Don't close — let user pick mode below
                    } else if (sortBy === opt.value) {
                      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      setSortMenuAnchor(null);
                    } else {
                      setSortBy(opt.value);
                      setSortDirection('desc');
                      setSortMenuAnchor(null);
                    }
                  }}
                  dense
                >
                  <ListItemText primary={t(opt.labelKey)} primaryTypographyProps={{ variant: 'body2' }} />
                  {sortBy === opt.value && opt.value !== 'none' && opt.value !== 'priority' && (
                    <Box sx={{ ml: 1 }}>
                      {sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 16, color: 'primary.main' }} /> : <ArrowDownward sx={{ fontSize: 16, color: 'primary.main' }} />}
                    </Box>
                  )}
                </MenuItem>
              ))}
              {sortBy === 'priority' && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                    {t('sort.priorityOrder')}
                  </Typography>
                  {PRIORITY_SORT_MODES.map((mode) => (
                    <MenuItem
                      key={mode}
                      selected={prioritySortMode === mode}
                      onClick={() => {
                        setPrioritySortMode(mode);
                        setSortMenuAnchor(null);
                      }}
                      dense
                      sx={{ pl: 3 }}
                    >
                      <ListItemText primary={PRIORITY_SORT_LABELS[mode]} primaryTypographyProps={{ variant: 'body2' }} />
                      {prioritySortMode === mode && (
                        <Box sx={{ ml: 1, color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>✓</Box>
                      )}
                    </MenuItem>
                  ))}
                </>
              )}
            </Menu>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Chip
                icon={<FilterList sx={{ fontSize: 16 }} />}
                label={`${filteredCardCount} / ${totalCardCount}`}
                size="small"
                onDelete={clearFilters}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          {/* Board columns */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                pb: 2,
                minHeight: 'calc(100vh - 200px)',
              }}
            >
              {[...filteredLists]
                .sort((a, b) => a.position - b.position)
                .map((list) => (
                  <BoardColumn
                    onDrop={(item) => handleTicketsDnD(item, list)}
                    list={list}
                    key={list.id}
                    setCardDialogState={setCardDialogState}
                    onCardClick={(card, listTitle) => setSelectedCard({ card, listTitle })}
                    onListUpdated={() => refetch()}
                    externalSortActive={sortBy !== 'none'}
                    isBacklog={list.position === 0}
                    onClearList={handleClearList}
                  />
                ))}

              <Paper
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  backgroundColor: isAddingList ? 'background.paper' : 'action.hover',
                  p: 2,
                }}
              >
                {isAddingList ? (
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={t('board.enterListName')}
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateList();
                      }}
                      autoFocus
                      disabled={createListLoading}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button variant="contained" size="small" onClick={handleCreateList} disabled={createListLoading || !newListTitle.trim()}>
                        {t('common.add')}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }}
                        disabled={createListLoading}
                      >
                        {t('common.cancel')}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Button fullWidth startIcon={<Add />} onClick={() => setIsAddingList(true)} sx={{ justifyContent: 'flex-start' }}>
                    {t('board.addList')}
                  </Button>
                )}
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>

      <CreateCardDialog
        open={cardDialogState.open}
        onClose={() => setCardDialogState({ open: false, listId: '', listTitle: '' })}
        listId={cardDialogState.listId}
        listTitle={cardDialogState.listTitle}
        boardId={id}
        onCardCreated={() => refetch()}
      />

      <TicketDetailDialog
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard?.card ?? null}
        listTitle={selectedCard?.listTitle}
        boardId={id}
        onCardUpdated={() => {
          setSelectedCard(null);
          refetch();
        }}
        onCardDeleted={() => {
          setSelectedCard(null);
          refetch();
        }}
      />

      {/* Delete All Lists Confirmation Dialog */}
      <Dialog open={deleteAllConfirmOpen} onClose={() => setDeleteAllConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          {t('danger.deleteAllListsTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('danger.deleteAllListsConfirm')}
          </DialogContentText>
          {(() => {
            const nonBacklogLists = board?.lists.filter((l) => l.position !== 0) ?? [];
            const totalCards = nonBacklogLists.reduce((sum, l) => sum + l.cards.length, 0);
            return (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {t('danger.willDeleteLists', { count: nonBacklogLists.length })}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                    {nonBacklogLists.map((l) => (
                      <li key={l.id}>
                        <Typography variant="body2">
                          {l.title} ({l.cards.length})
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
                {totalCards > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.dark' }}>
                    <Typography variant="body2">
                      {t('danger.cardsWillMove', { count: totalCards })} <strong>Backlog</strong>.
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteAllConfirmOpen(false)} disabled={deletingAllLists}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteAllLists} variant="contained" color="error" disabled={deletingAllLists}>
            {deletingAllLists ? t('common.deleting') : t('deleteConfirm.yesDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Tickets Board-Wide Confirmation Dialog */}
      <Dialog open={deleteAllTicketsBoardOpen} onClose={() => setDeleteAllTicketsBoardOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          {t('danger.deleteAllTicketsTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('danger.deleteAllTicketsConfirm')}
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2" fontWeight={600}>
              {t('danger.willDeleteTickets', { count: totalCardCount })}
            </Typography>
            {board && (
              <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                {board.lists.filter((l) => l.cards.length > 0).map((l) => (
                  <li key={l.id}>
                    <Typography variant="body2">
                      {l.title}: {l.cards.length}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t('column.cannotUndo')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteAllTicketsBoardOpen(false)} disabled={deletingAllTicketsBoard}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteAllTicketsBoard} variant="contained" color="error" disabled={deletingAllTicketsBoard}>
            {deletingAllTicketsBoard ? t('common.deleting') : `${t('deleteConfirm.yesDelete')} (${totalCardCount})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete By Priority Board-Wide Confirmation Dialog */}
      <Dialog open={deletePriorityBoardOpen} onClose={() => setDeletePriorityBoardOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          {t('danger.deleteByPriorityTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('danger.deleteByPriorityConfirm')}
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2" fontWeight={600}>
              {t('danger.willDeleteByPriority', { count: boardPriorityMatchCount })}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {selectedBoardPriorities.map((p) => {
                const opt = PRIORITY_OPTIONS.find((o) => o[0] === p);
                const count = board
                  ? board.lists.reduce((sum, l) => sum + l.cards.filter((c) => (c.priority || '') === p).length, 0)
                  : 0;
                return (
                  <Typography key={p} variant="body2">
                    {opt[1]?.icon} {opt ? t(opt[1].labelKey) : ''}: {count}
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
          <Button onClick={handleDeleteByPriorityBoard} variant="contained" color="error" disabled={deletingPriorityBoard}>
            {deletingPriorityBoard ? t('common.deleting') : `${t('deleteConfirm.yesDelete')} (${boardPriorityMatchCount})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
