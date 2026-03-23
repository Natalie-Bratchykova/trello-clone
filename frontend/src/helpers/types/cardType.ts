
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
}

export interface ParentCardOption {
    id: string;
    title: string;
    suffix?: string;
    listTitle?: string;
}

export interface GetUsersData {
    users: User[];
}

export interface UpdateCardData {
    updateCard: {
        card: {
            id: string;
            title: string;
            description: string;
            position: number;
            dueDate: string;
            priority: string;
            suffix: string;
            listId: string;
            userId: string;
            parentId: string;
            createdAt: string;
            updatedAt: string;
            user: User;
        };
        movedReleaseTasks: { id: string; listId: string; position: number }[];
    };
}

export interface EditCardData {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    userId?: string;
    parentId?: string;
    user?: {
        id: string;
        name: string;
        email?: string;
        profileImage?: string;
    } | null;
}

export interface EditCardDialogProps {
    open: boolean;
    onClose: () => void;
    card: EditCardData | null;
    boardId?: string;
    onCardUpdated?: () => void;
}