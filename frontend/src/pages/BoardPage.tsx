import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
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
import { ArrowBack, Add, MoreVert } from '@mui/icons-material';
import CreateCardDialog from '../components/CreateCardDialog';
import { GET_BOARD, CREATE_LIST_MUTATION } from '../helpers/gql/boardGQL';

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
      {/* Header */}
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

      {/* Lists Container */}
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
          {/* Existing Lists */}
          {[...board.lists]
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <Paper
                key={list.id}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 250px)',
                }}
              >
                {/* List Header */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {list.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        backgroundColor: 'action.hover',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {list.cards.length}
                    </Typography>
                    <IconButton size="small">
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Cards */}
                <Box
                  sx={{
                    p: 1,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {[...list.cards]
                    .sort((a, b) => a.position - b.position)
                    .map((card) => (
                      <Paper
                        key={card.id}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        elevation={1}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {card.title}
                        </Typography>
                        {card.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.5,
                            }}
                          >
                            {card.description}
                          </Typography>
                        )}
                        {(card.dueDate || card.user) && (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              mt: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            {card.dueDate && (
                              <Typography
                                variant="caption"
                                sx={{
                                  backgroundColor: 'warning.light',
                                  color: 'warning.dark',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                }}
                              >
                                {new Date(card.dueDate).toLocaleDateString('uk-UA')}
                              </Typography>
                            )}
                            {card.user && (
                              <Typography
                                variant="caption"
                                sx={{
                                  backgroundColor: 'primary.light',
                                  color: 'primary.dark',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                }}
                              >
                                {card.user.name}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    ))}
                </Box>

                {/* Add Card Button */}
                <Box sx={{ p: 1 }}>
                  <Button
                    fullWidth
                    startIcon={<Add />}
                    sx={{ justifyContent: 'flex-start' }}
                    onClick={() =>
                      setCardDialogState({
                        open: true,
                        listId: list.id,
                        listTitle: list.title,
                      })
                    }
                  >
                    Додати картку
                  </Button>
                </Box>
              </Paper>
            ))}

          {/* Add List */}
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

      {/* Create Card Dialog */}
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

