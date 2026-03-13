import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import  createUploadLink  from 'apollo-upload-client/UploadHttpLink.mjs';
const httpLink = new createUploadLink({
  uri: 'http://localhost:3000/graphql',
  headers: {
    'x-apollo-operation-name': 'UploadProfileImage',
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export { client, ApolloProvider };

