import {gql} from "@apollo/client";
import {useQuery} from "@apollo/client/react";

const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      email
      name
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
export const useUserData = (userId) => {
    const {data, loading, error, refetch} = useQuery(GET_USER_PROFILE, {
        variables: {userId},
    }) as any;

    return {data, loading, error, refetch} ;
}