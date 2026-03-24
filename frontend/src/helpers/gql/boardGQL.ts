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
        type
        cards {
          id
          title
          description
          listId
          position
          dueDate
          suffix
          priority
          type
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
          releaseTasks {
            id
            title
            suffix
            priority
            listId
            user {
              id
              name
              profileImage
            }
            list {
              id
              title
            }
          }
        }
      }
    }
  }
`;

export const MOVE_TICKET = gql`
  mutation moveCard($data: MoveCardInput!) {
    moveCard(data: $data) {
      card {
        id
        listId
        position
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

export const DELETE_ALL_LISTS_EXCEPT_BACKLOG = gql`
  mutation DeleteAllListsExceptBacklog($boardId: ID!) {
    deleteAllListsExceptBacklog(boardId: $boardId)
  }
`;

export const BULK_DELETE_CARDS_BY_LIST = gql`
  mutation BulkDeleteCardsByList($listId: ID!) {
    bulkDeleteCardsByList(listId: $listId)
  }
`;

export const BULK_DELETE_CARDS_BY_PRIORITY = gql`
  mutation BulkDeleteCardsByPriority($priority: CardPriority!, $boardId: ID, $listId: ID) {
    bulkDeleteCardsByPriority(priority: $priority, boardId: $boardId, listId: $listId)
  }
`;

export const BULK_DELETE_ALL_CARDS_BY_BOARD = gql`
  mutation BulkDeleteAllCardsByBoard($boardId: ID!) {
    bulkDeleteAllCardsByBoard(boardId: $boardId)
  }
`;

export const GET_BOARD_FOR_EDIT = gql`
  query GetBoardForEdit($id: ID!) {
    board(id: $id) {
      id
      title
      color
      boardIdentifier
      createdAt
      updatedAt
      lists {
        id
        title
        position
      }
    }
  }
`;

export const UPDATE_BOARD_MUTATION = gql`
  mutation UpdateBoard($id: ID!, $data: UpdateBoardInput!) {
    updateBoard(id: $id, data: $data) {
      id
      title
      color
      boardIdentifier
      updatedAt
    }
  }
`;