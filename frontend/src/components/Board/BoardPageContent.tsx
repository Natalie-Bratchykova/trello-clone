import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import type {Board, Card, List} from "../../helpers/types/BoardTypes.ts";
import {useCallback, useState} from "react";
import {useBoardFilter} from "../../context/BoardFilterContext.tsx";
import {useBoardDanger} from "../../context/BoardDangerContext.tsx";
import {useMutation} from "@apollo/client/react";
import {CREATE_LIST_MUTATION} from "../../helpers/gql/listGQL.ts";
import {MOVE_TICKET} from "../../helpers/gql/boardGQL.ts";
import {gql} from "@apollo/client";
import BoardDialog, {BoardDialogTypeEnum} from "./BoardDialog.tsx";
import {PRIORITY_SORT_LABELS, SORT_OPTIONS} from "../../helpers/utils/sortHelper.ts";
import {
    Avatar,
    Box,
    Button, Chip,
    Container,
    Divider,
    IconButton, InputAdornment,
    ListItemText,
    Menu,
    MenuItem, Paper,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add,
    ArrowBack,
    ArrowDownward,
    ArrowUpward,
    DeleteSweep,
    FilterList,
    Search,
    Settings,
    SwapVert
} from "@mui/icons-material";
import BoardDangerMenu from "./BoardDangerMenu.tsx";
import FilterSideBar from "../Filter/FilterSideBar.tsx";
import FilterItem from "../Filter/FilterItem.tsx";
import BoardColumn from "../BoardColumn.tsx";
import CreateCardDialog from "../CreateCardDialog.tsx";
import TicketDetailDialog from "../TicketDetailDialog.tsx";
import BoardPriorityDeleteDialog from "./BoardPriorityDeleteDialog.tsx";
import {PRIORITY_OPTIONS} from "../../helpers/utils/color.ts";
import AddListCard from "./AddListCart.tsx";


export default function BoardPageContent({ board, id, refetch }: { board: Board; id: string; refetch: () => void }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        searchQuery, setSearchQuery,
        selectedUsers, toggleUser,
        selectedPriorities, togglePriority,
        sortBy, setSortBy,
        sortDirection, setSortDirection,
        prioritySortMode, setPrioritySortMode,
        allBoardUsers,
        hasActiveFilters,
        totalCardCount, filteredCardCount,
        filteredLists,
        clearFilters,
    } = useBoardFilter();

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

    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [priorityMenuAnchor, setPriorityMenuAnchor] = useState<null | HTMLElement>(null);
    const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

    const { setDangerMenuAnchor } = useBoardDanger();


    const [createList, { loading: createListLoading }] = useMutation(CREATE_LIST_MUTATION, {
        onCompleted: () => {
            setNewListTitle('');
            setIsAddingList(false);
            refetch();
        },
    });

    const [moveTicket] = useMutation(MOVE_TICKET, {
        onError: (err) => console.error(err),
        update:function (cache, { data }) {
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

            moveCardInCache(movedCard.id, movedCard.listId, movedCard.position);

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
                        <BoardDangerMenu />
                    </Box>
                </Container>
            </Box>

            <Box sx={{ display: 'flex', flex: 1 }}>
                {/* Sidebar */}
                <FilterSideBar />

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
                                            <Search sx={{fontSize: 20, color: 'text.secondary'}}/>
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

                           <AddListCard boardId={id} onListCreated={refetch}/>
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
            <BoardDialog
                type={BoardDialogTypeEnum.LIST}
                text={{
                    deleteAllTicketsTitle: 'danger.deleteAllListsTitle',
                    deleteAllTicketsConfirm: 'danger.deleteAllListsConfirm',
                    willDeleteTickets: 'danger.willDeleteLists',
                    cannotUndo: '',
                    cancel: 'common.cancel',
                    deleting: 'common.deleting',
                    yesDelete: 'deleteConfirm.yesDelete'
                }}
            />
            <BoardDialog
                text={{deleteAllTicketsTitle: 'danger.deleteAllTicketsTitle',
                    deleteAllTicketsConfirm: 'danger.deleteAllTicketsConfirm',
                    willDeleteTickets: 'danger.willDeleteTickets',
                    cannotUndo: 'column.cannotUndo',
                    cancel: 'common.cancel',
                    deleting: 'common.deleting',
                    yesDelete: 'deleteConfirm.yesDelete'}}/>

            <BoardPriorityDeleteDialog />
        </Box>
    );
}