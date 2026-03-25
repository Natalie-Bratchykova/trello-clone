import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { GET_BOARD, MOVE_TICKET } from '../helpers/gql/boardGQL';
import type {List, Card, Board} from "../helpers/types/BoardTypes.ts";
import { BoardFilterProvider, useBoardFilter } from '../context/BoardFilterContext.tsx';
import { BoardDangerProvider, useBoardDanger } from '../context/BoardDangerContext.tsx';
import BoardPageContent from "../components/Board/BoardPageContent.tsx";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data, refetch } = useQuery<{ board: Board }>(GET_BOARD, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const board = data?.board ?? null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !board) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error ? `Error: ${error.message}` : 'Board not found'}</Alert>
      </Container>
    );
  }

  return (
    <BoardFilterProvider board={board}>
      <BoardDangerProvider board={board} boardId={id!}>
        <BoardPageContent board={board} id={id!} refetch={refetch} />
      </BoardDangerProvider>
    </BoardFilterProvider>
  );
}


