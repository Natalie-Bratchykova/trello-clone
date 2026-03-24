export interface BoardColumnProps {
    list: {
        id: string;
        title: string;
        position: number;
        cards: {
            id: number;
            title: string;
            description: string;
            position: number;
            dueDate: string | null;
            priority?: string;
            user: {
                id: number;
                name: string;
            } | null;
        }[];
    };
    lastDroppedCardId?: string | null;
    onDrop: (item: any) => void;
    onCardClick?: (card: any, listTitle: string) => void;
    setCardDialogState: (state: { open: boolean; listId: string; listTitle: string }) => void;
    onListUpdated?: () => void;
    externalSortActive?: boolean;
    isBacklog?: boolean;
    onClearList?: (listId: string, cards: any[]) => Promise<void>;
}

export interface ListItem {
    id: string;
    title: string;
    position: number;
}

export interface BoardData {
    board: {
        id: string;
        title: string;
        color: string;
        boardIdentifier?: string;
        createdAt: string;
        updatedAt: string;
        lists: ListItem[];
    };
}