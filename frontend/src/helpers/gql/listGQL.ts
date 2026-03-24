import {gql} from "@apollo/client";

export const UPDATE_LIST_MUTATION = gql`
  mutation UpdateListTitle($id: ID!, $data: UpdateListInput!) {
    updateList(id: $id, data: $data) {
      id
      title
      position
    }
  }
`;

export const DELETE_LIST_MUTATION = gql`
  mutation DeleteListFromBoard($id: ID!) {
    deleteList(id: $id)
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
export const MOVE_LIST_MUTATION = gql`
  mutation MoveList($data: MoveListInput!) {
    moveList(data: $data) {
      id
      title
      position
    }
  }
`;