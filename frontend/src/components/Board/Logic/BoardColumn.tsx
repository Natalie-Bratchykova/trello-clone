import {useState, useRef, MouseEvent, memo} from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../../../helpers/types/ItemTypes.ts';
import type {BoardColumnProps} from "../../../helpers/types/listTypes.ts";
import BoarderColumnVisual from "../Visual/BoarderColumnVisual.tsx";
import {
    useBulkDeleteCardsByListMutation, useBulkDeleteCardsByPriorityMutation,
    useDeleteListFromBoardMutation,
    useUpdateListTitleMutation
} from "../../../generated/graphql.ts";


function BoardColumn ({ list, setCardDialogState, onDrop, onCardClick, onListUpdated, externalSortActive, isBacklog, onClearList }: BoardColumnProps) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(list.title);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    // Bulk delete tickets state
    const [deleteAllTicketsOpen, setDeleteAllTicketsOpen] = useState(false);
    const [deleteByPriorityOpen, setDeleteByPriorityOpen] = useState(false);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [prioritySubmenuAnchor, setPrioritySubmenuAnchor] = useState<null | HTMLElement>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);


    const [updateList, { loading: updating }] = useUpdateListTitleMutation();
    const [deleteList, { loading: deleting }] = useDeleteListFromBoardMutation();
    const [bulkDeleteByList, { loading: bulkDeletingAll }] = useBulkDeleteCardsByListMutation();
    const [bulkDeleteByPriority, { loading: bulkDeletingPriority }] = useBulkDeleteCardsByPriorityMutation();

    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: [ItemTypes.TICKET],
        drop: onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const handleMenuOpen = (e: MouseEvent<HTMLElement>) => {
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleEditStart = () => {
        handleMenuClose();
        setEditTitle(list.title);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleEditSave = async () => {
        if (!editTitle.trim() || editTitle.trim() === list.title) {
            setIsEditing(false);
            return;
        }
        try {
            // @ts-ignore
            await updateList({
                variables: {
                    id: list.id,
                    data: { title: editTitle.trim() }
                },
            });
            setIsEditing(false);
            onListUpdated?.();
        } catch (err) {
            console.error('Error updating list:', err);
        }
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditTitle(list.title);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        setDeleteConfirmOpen(true);
    };

    const handleClearClick = () => {
        handleMenuClose();
        setClearConfirmOpen(true);
    };

    const handleClearConfirm = async () => {
        if (!onClearList) return;
        setClearing(true);
        try {
            await onClearList(list.id, list.cards);
            setClearConfirmOpen(false);
        } catch (err) {
            console.error('Error clearing list:', err);
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            // @ts-ignore
            await deleteList({ variables: { id: list.id } });
            setDeleteConfirmOpen(false);
            onListUpdated?.();
        } catch (err) {
            console.error('Error deleting list:', err);
        }
    };

    // Bulk delete all tickets in column
    const handleDeleteAllTicketsClick = () => {
        handleMenuClose();
        setDeleteAllTicketsOpen(true);
    };

    const handleDeleteAllTicketsConfirm = async () => {
        try {
            // @ts-ignore
            await bulkDeleteByList({
                variables: { listId: list.id },
                update(cache, { data }) {
                    const deletedIds: string[] = data?.bulkDeleteCardsByList ?? [];
                    for (const cardId of deletedIds) {
                        cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
                    }
                    cache.modify({
                        id: cache.identify({ __typename: 'ListObject', id: list.id }),
                        fields: {
                            cards() { return []; },
                        },
                    });
                    cache.gc();
                },
            });
            setDeleteAllTicketsOpen(false);
        } catch (err) {
            console.error('Error bulk deleting tickets:', err);
        }
    };

    // Delete by priority
    const handleDeleteByPriorityClick = (e: MouseEvent<HTMLElement>) => {
        handleMenuClose();
        setSelectedPriorities([]);
        setPrioritySubmenuAnchor(e.currentTarget);
    };

    const togglePriority = (p: string) => {
        setSelectedPriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
    };

    const handlePriorityDeleteProceed = () => {
        setPrioritySubmenuAnchor(null);
        setDeleteByPriorityOpen(true);
    };

    const matchingPriorityCards = list.cards.filter((c) => selectedPriorities.includes(c.priority || ''));

    const handleDeleteByPriorityConfirm = async () => {
        try {
            for (const priority of selectedPriorities) {
                // @ts-ignore
                await bulkDeleteByPriority({
                    variables: { priority, listId: list.id },
                    update(cache, { data }) {
                        const deletedIds: string[] = data?.bulkDeleteCardsByPriority ?? [];
                        for (const cardId of deletedIds) {
                            cache.evict({ id: cache.identify({ __typename: 'CardObject', id: cardId }) });
                        }
                        cache.modify({
                            id: cache.identify({ __typename: 'ListObject', id: list.id }),
                            fields: {
                                cards(existingRefs: any[] = [], { readField }) {
                                    return existingRefs.filter((ref) => !deletedIds.includes(readField('id', ref) as string));
                                },
                            },
                        });
                        cache.gc();
                    },
                });
            }
            setDeleteByPriorityOpen(false);
            setSelectedPriorities([]);
        } catch (err) {
            console.error('Error deleting by priority:', err);
        }
    };

    let props = {
        dropRef,
        inputRef,
        editTitle,
        isEditing,
        setEditTitle,
        handleEditSave,
        handleEditCancel,
        updating,
        handleMenuOpen,
        handleEditStart,
        menuAnchor,
        list,
        handleClearClick,
        handleDeleteClick,
        // todo start: this one is also via props sent
        onCardClick,
        // todo end
        handleDeleteAllTicketsClick,
        handleDeleteByPriorityClick,
        prioritySubmenuAnchor,
        setPrioritySubmenuAnchor,
        togglePriority,
        handleMenuClose,
        isBacklog,
        selectedPriorities,
        matchingPriorityCards,
        handlePriorityDeleteProceed,
        // this one should be in Provider because of it is already passed as props
        externalSortActive,
        setCardDialogState,
        // delete all tickets props
        deleteAllTicketsOpen,
        setDeleteAllTicketsOpen,
        handleDeleteAllTicketsConfirm,
        bulkDeletingAll,
        // confirm delete list props
        clearConfirmOpen,
        setClearConfirmOpen,
        handleClearConfirm,
        clearing,
        // delete priority
        deleteByPriorityOpen, setDeleteByPriorityOpen, handleDeleteByPriorityConfirm, bulkDeletingPriority,
        // delete confirm props
        deleteConfirmOpen, setDeleteConfirmOpen, handleDeleteConfirm, deleting

    }
    return (
        <BoarderColumnVisual {...props} />
    );
}


export default memo(BoardColumn);
