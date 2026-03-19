import {useState, useCallback} from 'react';
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
import TicketDetailDialog from '../components/TicketDetailDialog';
import {GET_BOARD, CREATE_LIST_MUTATION, MOVE_TICKET} from '../helpers/gql/boardGQL';
import BoardColumn from "../components/BoardColumn.tsx";
import {gql} from "@apollo/client";

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  suffix?: string;
  priority?: string;
  listId?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    profileImage?: string;
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

  const [selectedCard, setSelectedCard] = useState<{ card: Card; listTitle: string } | null>(null);

  const { loading, error, data, refetch } = useQuery<{ board: Board }>(GET_BOARD, {
    variables: { id },
    skip: !id,
  });

  const board = data?.board ?? null;

  const [createList, { loading: createListLoading }] = useMutation(CREATE_LIST_MUTATION, {
    onCompleted: () => {
      setNewListTitle('');
      setIsAddingList(false);
      refetch();
    },
  });

  const [moveTicket] = useMutation(MOVE_TICKET, {
    onError: (err) => console.error(err),
    update(cache, { data }) {
      const movedCard = data?.moveCard;
      if (!movedCard || !board?.lists) return;

      const sourceList = board.lists.find((list) => list.cards.some((c) => c.id === movedCard.id));
      if (!sourceList) return;

      const targetListId = movedCard.listId;

      cache.modify({
        id: cache.identify({ __typename: 'ListObject', id: sourceList.id }),
        fields: {
          cards(existingCardRefs: any[] = [], { readField }) {
            return existingCardRefs.filter((ref) => readField('id', ref) !== movedCard.id);
          },
        },
      });

      cache.modify({
        id: cache.identify({ __typename: 'ListObject', id: targetListId }),
        fields: {
          cards(existingCardRefs: any[] = [], { readField, toReference }) {
            const alreadyInList = existingCardRefs.some((ref) => readField('id', ref) === movedCard.id);
            const cardRef =
              toReference({ __typename: 'CardObject', id: movedCard.id }) ??
              cache.writeFragment({
                data: { __typename: 'CardObject', id: movedCard.id },
                fragment: gql`
                  fragment MinimalCard on CardObject {
                    id
                  }
                `,
              });

            if (alreadyInList) return existingCardRefs;

            const insertAt = Math.max(0, Math.min(movedCard.position ?? existingCardRefs.length, existingCardRefs.length));
            return [
              ...existingCardRefs.slice(0, insertAt),
              cardRef,
              ...existingCardRefs.slice(insertAt),
            ];
          },
        },
      });

      cache.modify({
        id: cache.identify({ __typename: 'CardObject', id: movedCard.id }),
        fields: {
          listId() {
            return movedCard.listId;
          },
          position() {
            return movedCard.position;
          },
        },
      });
    },
  });

  const handleTicketsDnD = useCallback((item: Card & { listId: string }, targetList: List) => {
    const sourceListId = item.listId;
    if (sourceListId === targetList.id) return;

    const position = targetList.cards.length;

    moveTicket({
      variables: { data: { cardId: item.id, targetListId: targetList.id, position } },
      optimisticResponse: {
        moveCard: {
          __typename: 'CardObject',
          id: item.id,
          listId: targetList.id,
          position,
        },
      },
    });
  }, [moveTicket]);

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
             <BoardColumn
               onDrop={(item)=>handleTicketsDnD(item, list)}
               list={list}
               key={list.id}
               setCardDialogState={setCardDialogState}
               onCardClick={(card, listTitle) => setSelectedCard({ card, listTitle })}
             />
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

      <TicketDetailDialog
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard?.card ?? null}
        listTitle={selectedCard?.listTitle}
      />
    </Box>
  );
}
