import {gql} from "@apollo/client";

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      email
      name
      roleId
      profileImage
      createdAt
      updatedAt
    }
    userBoards(userId: $userId) {
      id
      title
      color
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      email
      roleId
      name
      profileImage
    }
  }
`;

export  const GET_ALL_ROLES = gql`
  query GetAllRoles {
    roles {
      id
      name
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(data: { email: $email, password: $password }) {
      id
      email
      name
    }
  }
`;