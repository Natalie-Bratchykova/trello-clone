import {gql} from "@apollo/client";

export const DELETE_CARD_MUTATION = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;
export  const ASSIGN_USER_MUTATION = gql`
  mutation AssignUserToCard($cardId: ID!, $userId: ID) {
    assignUser(cardId: $cardId, userId: $userId) {
      id
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

export const GET_BOARD_LISTS = gql`
  query GetBoardListsForDialog($boardId: ID!) {
    boardLists(boardId: $boardId) {
      id
      title
      position
    }
  }
`;


export const GET_CARD = gql`
  query GetCard($id: ID!) {
    card(id: $id) {
      id
      title
      description
      suffix
      priority
      position
      dueDate
      createdAt
      updatedAt
      listId
      userId
      parentId
      list {
        id
        title
        board {
          id
          title
          color
        }
      }
      user {
        id
        name
        email
        profileImage
      }
      parent {
        id
        title
        suffix
      }
      children {
        id
        title
        suffix
        priority
        dueDate
        user {
          id
          name
        }
      }
    }
  }
`;
export const UPDATE_CARD_LIST = gql`
  mutation UpdateCardList($id: ID!, $data: UpdateCardInput!) {
    updateCard(id: $id, data: $data) {
      card {
        id
        listId
        list {
          id
          title
          board {
            id
            title
            color
          }
        }
      }
      movedReleaseTasks {
        id
        listId
        position
        list {
          id
          title
        }
      }
    }
  }
`;