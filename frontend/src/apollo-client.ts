import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import  createUploadLink  from 'apollo-upload-client/UploadHttpLink.mjs';
import {GRAPH_GQL_URL} from "./helpers/config";
const httpLink = new createUploadLink({
  uri: GRAPH_GQL_URL,
  headers: {
    'x-apollo-operation-name': 'UploadProfileImage',
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export { client, ApolloProvider };

