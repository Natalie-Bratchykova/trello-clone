import {useQuery} from "@apollo/client/react";
import {GET_USER_PROFILE, GET_USER_PROFILE_SMALL} from "../helpers/gql/userGQL.ts";

export const useUserData = (userId, skip = false) => {
    const {data, loading, error, refetch} = useQuery(GET_USER_PROFILE_SMALL, {
        variables: {userId},
        skip,
    }) as any;

    return {data, loading, error, refetch} ;
}

export const useUserDataFull = (userId, skip = false) => {
    const {data, loading, error, refetch} = useQuery(GET_USER_PROFILE, {
        variables: {userId},
        skip,
    }) as any;

    return {data, loading, error, refetch} ;
}