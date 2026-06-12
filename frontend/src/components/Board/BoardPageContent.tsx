import {useTranslation} from "react-i18next";
import type {Board, Card, List} from "../../helpers/types/BoardTypes.ts";
import {useCallback, useState} from "react";
import {useBoardFilter} from "../../context/BoardFilterContext.tsx";
import {useBoardDanger} from "../../context/BoardDangerContext.tsx";
import {useMutation} from "@apollo/client/react";
import {MOVE_TICKET} from "../../helpers/gql/boardGQL.ts";
import {gql} from "@apollo/client";
import BoardDialog, {BoardDialogTypeEnum} from "./BoardDialog.tsx";

import {
    Avatar,
    Box,
    ListItemText,
} from '@mui/material';
import FilterSideBar from "../Filter/FilterSideBar.tsx";
import FilterItemComponent from "../Filter/FilterItem.tsx";
import CreateCardDialog from "../Ticket/Logic/CreateCardDialog.tsx";
import TicketDetailDialog from "../TicketDetailDialog/TicketDetailDialog.tsx";
import BoardPriorityDeleteDialog from "./BoardPriorityDeleteDialog.tsx";
import {PRIORITY_OPTIONS} from "../../helpers/utils/color.ts";
import {getUserProfileUrl} from "../../helpers/utils/userHelper.ts";
import BoardHeader from "./Visual/BoardHeader.tsx";
import BoardMainContent from "./Visual/BoardMainContent.tsx";


export default function BoardPageContent({ board, id, refetch }: { board: Board; id: string; refetch: () => void }) {
    const { t } = useTranslation();

    const {
        selectedUsers, toggleUser,
        selectedPriorities, togglePriority,
        allBoardUsers,
    } = useBoardFilter();

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


    const { setDangerMenuAnchor } = useBoardDanger();


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

    const boardHeaderProps = {board, id, setDangerMenuAnchor };
    const boardMainContentProps = {handleTicketsDnD, setCardDialogState, setSelectedCard, handleClearList, id, refetch};

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <BoardHeader {...boardHeaderProps}/>
            <Box sx={{ display: 'flex', flex: 1 }}>
                <FilterSideBar />
                <BoardMainContent {...boardMainContentProps}>
                    <>
                        <FilterItemComponent
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
                                        src={getUserProfileUrl(user?.profileImage)}
                                    >
                                        {user.name?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <ListItemText primary={user.name} primaryTypographyProps={{ variant: 'body2' }} />
                                </>
                            )}
                        />
                        <FilterItemComponent
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
                        /></>
                </BoardMainContent>
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