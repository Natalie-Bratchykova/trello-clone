import {useState, useEffect, useCallback} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import CreateCardDialog from '../components/CreateCardDialog';
import { GET_BOARD, CREATE_LIST_MUTATION } from '../helpers/gql/boardGQL';
import BoardColumn from "../components/BoardColumn.tsx";

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  user?: {
    id: string;
    name: string;
  };
}

interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  lists: List[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [cardDialogState, setCardDialogState] = useState<{
    open: boolean;
    listId: string;
    listTitle: string;
  }>({
    open: false,
    listId: '',
    listTitle: '',
  });

  const { loading, error, data, refetch } = useQuery<{ board: Board }>(GET_BOARD, {
    variables: { id },
    skip: !id,
  });

  const [createList, { loading: createListLoading }] = useMutation(CREATE_LIST_MUTATION, {
    onCompleted: () => {
      setNewListTitle('');
      setIsAddingList(false);
      refetch();
    },
  });

  const handleTicketsDnD = useCallback((item, targetList) => {
    const { listId } = item;

    setBoard((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        lists: prev.lists.map((l) => {
          if (l.id === listId) {
            // TODO: add here state management for cards
            return {
              ...l,
              cards: l.cards.filter((c) => c.id !== item.id),
            };
          }

          if (l.id === targetList.id) {
            let newItem = {
              ...item,
              listId: targetList.id,
            }
            return {
              ...l,
              cards: [...l.cards, newItem]
            };
          }

          return l;
        }),
      };
    });
  }, []);

  useEffect(() => {
    if (data?.board) {
      setBoard(data.board);
    }
  }, [data]);

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !id) return;

    try {
      await createList({
        variables: {
          title: newListTitle.trim(),
          boardId: id,
        },
      });
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !board) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error ? `Помилка: ${error.message}` : 'Дошку не знайдено'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Повернутись до проектів
        </Button>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        pb: 4,
      }}
    >
      <Box
        sx={{
          backgroundColor: board.color,
          color: 'white',
          py: 2,
          px: 3,
          mb: 3,
        }}
      >
        <Container maxWidth={false}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => history.back()}
              sx={{ color: 'white' }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {board.title}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            minHeight: '70vh',
          }}
        >
          {[...board.lists]
            .sort((a, b) => a.position - b.position)
            .map((list) => (
             <BoardColumn onDrop={(item)=>handleTicketsDnD(item, list)} list={list} key={list.id} setCardDialogState={setCardDialogState}/>
            ))}

          <Paper
            sx={{
              minWidth: 300,
              maxWidth: 300,
              backgroundColor: isAddingList ? 'background.paper' : 'action.hover',
              p: 2,
            }}
          >
            {isAddingList ? (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Введіть назву списку..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateList();
                    }
                  }}
                  autoFocus
                  disabled={createListLoading}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreateList}
                    disabled={createListLoading || !newListTitle.trim()}
                  >
                    Додати
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                    }}
                    disabled={createListLoading}
                  >
                    Скасувати
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                fullWidth
                startIcon={<Add />}
                onClick={() => setIsAddingList(true)}
                sx={{ justifyContent: 'flex-start' }}
              >
                Додати список
              </Button>
            )}
          </Paper>
        </Box>
      </Container>

      <CreateCardDialog
        open={cardDialogState.open}
        onClose={() => setCardDialogState({ open: false, listId: '', listTitle: '' })}
        listId={cardDialogState.listId}
        listTitle={cardDialogState.listTitle}
        onCardCreated={() => refetch()}
      />
    </Box>
  );
}

