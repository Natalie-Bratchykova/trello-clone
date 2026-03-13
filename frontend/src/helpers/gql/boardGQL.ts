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
          user {
            id
            name
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

export const DELETE_BOARD_MUTATION = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;