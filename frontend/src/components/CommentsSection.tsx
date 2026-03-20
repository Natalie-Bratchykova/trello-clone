import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Send, Edit, Delete, Close, Check } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const GET_CARD_COMMENTS = gql`
  query GetCardComments($cardId: ID!) {
    cardComments(cardId: $cardId) {
      id
      content
      createdAt
      updatedAt
      userId
      user {
        id
        name
        email
        profileImage
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($data: CreateCommentInput!) {
    createComment(data: $data) {
      id
      content
      createdAt
      updatedAt
      userId
      user {
        id
        name
        email
        profileImage
      }
    }
  }
`;

const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $data: UpdateCommentInput!, $userId: ID!) {
    updateComment(id: $id, data: $data, userId: $userId) {
      id
      content
      updatedAt
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!, $userId: ID!) {
    deleteComment(id: $id, userId: $userId)
  }
`;

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email?: string;
    profileImage?: string;
  };
}

interface CommentsSectionProps {
  cardId: string;
}

export default function CommentsSection({ cardId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const { t, i18n } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { data, loading, refetch } = useQuery<{ cardComments: Comment[] }>(GET_CARD_COMMENTS, {
    variables: { cardId },
    skip: !cardId,
  });

  const [createComment, { loading: creating }] = useMutation(CREATE_COMMENT, {
    onCompleted: () => {
      setNewComment('');
      refetch();
    },
  });

  const [updateComment] = useMutation(UPDATE_COMMENT, {
    onCompleted: () => {
      setEditingId(null);
      setEditContent('');
      refetch();
    },
  });

  const [deleteComment] = useMutation(DELETE_COMMENT, {
    onCompleted: () => refetch(),
  });

  const handleSubmit = () => {
    if (!newComment.trim() || !currentUser?.id) return;
    createComment({
      variables: {
        data: {
          content: newComment.trim(),
          cardId,
          userId: currentUser.id,
        },
      },
    });
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateComment({
      variables: {
        id,
        data: { content: editContent.trim() },
        userId: currentUser.id,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteComment({
      variables: { id, userId: currentUser.id },
    });
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const comments = data?.cardComments || [];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t('comments.title')} {comments.length > 0 && `(${comments.length})`}
      </Typography>

      {/* New comment input */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'flex-start' }}>
        <Avatar
          sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main', mt: 0.5 }}
        >
          {currentUser?.name?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            placeholder={t('comments.placeholder')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
            disabled={creating}
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('comments.ctrlEnter')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              endIcon={<Send sx={{ fontSize: 16 }} />}
              onClick={handleSubmit}
              disabled={!newComment.trim() || creating}
            >
              {t('comments.send')}
            </Button>
          </Box>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Comments list */}
      {comments.length === 0 && !loading && (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
          {t('comments.noComments')}
        </Typography>
      )}

      {comments.map((comment, index) => (
        <Box key={comment.id}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Avatar
              src={comment.user.profileImage ? `http://localhost:3000${comment.user.profileImage}` : undefined}
              sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'secondary.main', mt: 0.5 }}
            >
              {!comment.user.profileImage && comment.user.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {comment.user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(comment.createdAt, t, i18n.language)}
                </Typography>
                {comment.createdAt !== comment.updatedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('comments.edited')}
                  </Typography>
                )}
              </Box>

              {editingId === comment.id ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    size="small"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleUpdate(comment.id);
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleUpdate(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      <Check fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setEditingId(null)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                    }}
                  >
                    {comment.content}
                  </Typography>

                  {currentUser?.id === comment.userId && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <IconButton size="small" onClick={() => startEdit(comment)} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(comment.id)}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function formatRelativeTime(dateStr: string, t: any, lang: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('comments.justNow');
  if (diffMin < 60) return t('comments.minutesAgo', { count: diffMin });
  if (diffHours < 24) return t('comments.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('comments.daysAgo', { count: diffDays });
  const locale = lang === 'uk' ? 'uk-UA' : lang === 'ja' ? 'ja-JP' : 'en-US';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

