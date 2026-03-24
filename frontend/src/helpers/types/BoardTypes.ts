export interface Card {
    id: string;
    title: string;
    description?: string;
    position: number;
    dueDate?: string;
    suffix?: string;
    priority?: string;
    listId?: string;
    createdAt?: string;
    updatedAt?: string;
    parentId?: string;
    user?: {
        id: string;
        name: string;
        email?: string;
        profileImage?: string;
    };
    parent?: {
        id: string;
        title: string;
        suffix?: string;
    };
    children?: {
        id: string;
        title: string;
        suffix?: string;
        priority?: string;
        dueDate?: string;
        user?: {
            id: string;
            name: string;
        };
    }[];
}

export interface List {
    id: string;
    title: string;
    position: number;
    cards: Card[];
}

export interface Board {
    id: string;
    title: string;
    color: string;
    createdAt: string;
    lists: List[];
}