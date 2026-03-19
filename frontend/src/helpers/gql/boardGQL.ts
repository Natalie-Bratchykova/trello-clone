import {gql} from "@apollo/client";

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      color
      createdAt
      lists {
        id
        title
        position
        cards {
          id
          title
          description
          listId
          position
          dueDate
          suffix
          priority
          createdAt
          updatedAt
          parentId
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
    }
  }
`;
export const CREATE_LIST_MUTATION = gql`
  mutation CreateList($title: String!, $boardId: ID!) {
    createList(data: { title: $title, boardId: $boardId }) {
      id
      title
      position
    }
  }
`;
export const MOVE_TICKET = gql`
  mutation moveCard($data: MoveCardInput!) {
    moveCard(data: $data) {
      id
      listId
      position
    }
  }
`;

export const GET_USER_BOARDS = gql`
  query GetUserBoards($userId: ID!) {
    userBoards(userId: $userId) {
      id
      title
      color
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_BOARDS = gql`
  query GetAllBoards {
    boards {
      id
      title
      color
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BOARD_MUTATION = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;