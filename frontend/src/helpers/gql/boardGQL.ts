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