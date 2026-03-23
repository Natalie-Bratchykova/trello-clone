export interface CommentsSectionProps {
    cardId: string;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email?: string;
        profileImage?: string;
    };
}