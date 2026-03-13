import {useQuery} from "@apollo/client/react";
import { GET_USER_PROFILE } from "../helpers/gql/userGQL.ts";

export const useUserData = (userId) => {
    const {data, loading, error, refetch} = useQuery(GET_USER_PROFILE, {
        variables: {userId},
    }) as any;

    return {data, loading, error, refetch} ;
}