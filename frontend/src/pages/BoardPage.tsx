import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

import { BoardFilterProvider } from '../context/BoardFilterContext.tsx';
import { BoardDangerProvider } from '../context/BoardDangerContext.tsx';
import BoardPageContent from "../components/Board/BoardPageContent.tsx";
import {useGetBoardQuery} from "../generated/graphql.ts";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  // @ts-ignore
  const { loading, error, data, refetch } = useGetBoardQuery({
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  })

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


