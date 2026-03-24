import {useState} from "react";
import {useApolloClient, useMutation, useQuery} from "@apollo/client/react";
import {useTranslation} from "react-i18next";
import {ASSIGN_USER_MUTATION, DELETE_CARD_MUTATION, GET_BOARD_LISTS, UPDATE_CARD_LIST} from "../gql/cardGQL.ts";

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



export interface TicketDetailCard {
    id: string;
    title: string;
    description?: string;
    position: number;
    dueDate?: string;
    suffix?: string;
    priority?: string;
    type?: string;
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
    releaseTasks?: {
        id: string;
        title: string;
        suffix?: string;
        priority?: string;
        listId?: string;
        user?: {
            id: string;
            name: string;
            profileImage?: string;
        };
        list?: {
            id: string;
            title: string;
        };
    }[];
}

export interface TicketDetailDialogProps {
    open: boolean;
    onClose: () => void;
    card: TicketDetailCard | null;
    listTitle?: string;
    boardId?: string;
    onCardUpdated?: () => void;
    onCardDeleted?: () => void;
}