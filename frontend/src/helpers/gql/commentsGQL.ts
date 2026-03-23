import {gql} from "@apollo/client";

export const GET_CARD_COMMENTS = gql`
  query GetCardComments($cardId: ID!) {
    cardComments(cardId: $cardId) {
      id
      content
      createdAt
      updatedAt
      userId
      user {
        id
        name
        email
        profileImage
      }
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($data: CreateCommentInput!) {
    createComment(data: $data) {
      id
      content
      createdAt
      updatedAt
      userId
      user {
        id
        name
        email
        profileImage
      }
    }
  }`;

export const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $data: UpdateCommentInput!, $userId: ID!) {
    updateComment(id: $id, data: $data, userId: $userId) {
      id
      content
      updatedAt
    }
  }
`;
export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!, $userId: ID!) {
    deleteComment(id: $id, userId: $userId)
  }
`;