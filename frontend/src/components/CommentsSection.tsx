import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  Checkbox,
} from '@mui/material';
import { Send, Edit, Delete, Close, Check, Checklist } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TextEditorUneditable from "./Ticket/TextEditorUneditable.tsx";

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

const COMMENT_QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const COMMENT_QUILL_FORMATS = [
  'bold', 'italic', 'underline', 'strike',
  'list',
  'blockquote', 'code-block',
  'link',
];

function isQuillContentEmpty(html: string): boolean {
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0;
}

/** Extract text items from HTML description and build a checklist HTML */
function descriptionToChecklist(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const items: string[] = [];

  // Try to extract list items first
  const listItems = div.querySelectorAll('li');
  if (listItems.length > 0) {
    listItems.forEach((li) => {
      const text = li.textContent?.trim();
      if (text) items.push(text);
    });
  } else {
    // Fall back to paragraphs / lines
    const blocks = div.querySelectorAll('p, h1, h2, h3, div');
    if (blocks.length > 0) {
      blocks.forEach((block) => {
        const text = block.textContent?.trim();
        if (text) items.push(text);
      });
    } else {
      // Plain text — split by newlines
      const text = div.textContent || '';
      text.split(/\n+/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) items.push(trimmed);
      });
    }
  }

  if (items.length === 0) return '';

  // Build checklist HTML: each item as a checkbox line
  return items
    .map((item) => `<p>☐ ${item}</p>`)
    .join('');
}

/** Check if content has checklist items (☐ or ☑) */
function isChecklist(html: string): boolean {
  return /[☐☑]/.test(html);
}

/** Toggle a specific checklist item by index */
function toggleChecklistItem(html: string, targetIndex: number): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  let checkIndex = 0;

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const replaced = text.replace(/[☐☑]/g, (match) => {
        if (checkIndex === targetIndex) {
          checkIndex++;
          return match === '☐' ? '☑' : '☐';
        }
        checkIndex++;
        return match;
      });
      if (replaced !== text) {
        node.textContent = replaced;
      }
    } else {
      node.childNodes.forEach(walk);
    }
  };
  walk(div);
  return div.innerHTML;
}

/** Get array of checked states from html */
function getCheckStates(html: string): boolean[] {
  const states: boolean[] = [];
  const regex = /[☐☑]/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    states.push(m[0] === '☑');
  }
  return states;
}

export default function CommentsSection({ cardId, cardDescription }: CommentsSectionProps) {
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
    if (isQuillContentEmpty(newComment) || !currentUser?.id) return;
    createComment({
      variables: {
        data: {
          content: newComment,
          cardId,
          userId: currentUser.id,
        },
      },
    });
  };

  const handleUpdate = (id: string) => {
    if (isQuillContentEmpty(editContent)) return;
    updateComment({
      variables: {
        id,
        data: { content: editContent },
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
          <Box
            sx={{
              '& .ql-container': {
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                fontSize: '0.875rem',
              },
              '& .ql-toolbar': {
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              },
              '& .ql-editor': {
                minHeight: 80,
                maxHeight: 200,
                overflowY: 'auto',
              },
            }}
          >
            <ReactQuill
              theme="snow"
              value={newComment}
              onChange={setNewComment}
              modules={COMMENT_QUILL_MODULES}
              formats={COMMENT_QUILL_FORMATS}
              placeholder={t('comments.placeholder')}
              readOnly={creating}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t('comments.ctrlEnter')}
              </Typography>
              {cardDescription && !isQuillContentEmpty(cardDescription) && (
                <Tooltip title={t('comments.copyAsChecklist')} arrow>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Checklist sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      const checklist = descriptionToChecklist(cardDescription);
                      if (checklist) setNewComment(checklist);
                    }}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    {t('comments.copyAsChecklist')}
                  </Button>
                </Tooltip>
              )}
            </Box>
            <Button
              variant="contained"
              size="small"
              endIcon={<Send sx={{ fontSize: 16 }} />}
              onClick={handleSubmit}
              disabled={isQuillContentEmpty(newComment) || creating}
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
                  <Box
                    sx={{
                      '& .ql-container': {
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                        fontSize: '0.875rem',
                      },
                      '& .ql-toolbar': {
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      },
                      '& .ql-editor': {
                        minHeight: 60,
                        maxHeight: 200,
                        overflowY: 'auto',
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={editContent}
                      onChange={setEditContent}
                      modules={COMMENT_QUILL_MODULES}
                      formats={COMMENT_QUILL_FORMATS}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleUpdate(comment.id)}
                      disabled={isQuillContentEmpty(editContent)}
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
                  {isChecklist(comment.content) ? (
                    <ChecklistRenderer
                      html={comment.content}
                      onToggle={(_idx, updatedHtml) => {
                        updateComment({
                          variables: {
                            id: comment.id,
                            data: { content: updatedHtml },
                            userId: currentUser.id,
                          },
                        });
                      }}
                    />
                  ) : (
                    <TextEditorUneditable html={comment.comment}/>
                  )}

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

function parseChecklistItems(html: string): { checked: boolean; text: string }[] {
  const states = getCheckStates(html);
  const div = document.createElement('div');
  div.innerHTML = html;
  const textContent = div.textContent || '';
  const items: { checked: boolean; text: string }[] = [];

  const regex = /[☐☑]\s*(.*?)(?=[☐☑]|$)/gs;
  let m;
  let idx = 0;
  while ((m = regex.exec(textContent)) !== null) {
    items.push({
      checked: states[idx] ?? false,
      text: m[1].trim(),
    });
    idx++;
  }
  return items;
}

function ChecklistRenderer({
  html,
  onToggle,
}: {
  html: string;
  onToggle: (index: number, newHtml: string) => void;
}) {
  const [localHtml, setLocalHtml] = useState(html);

  // Sync local state when server data (html prop) changes
  useEffect(() => {
    setLocalHtml(html);
  }, [html]);

  const items = parseChecklistItems(localHtml);

  if (items.length === 0) return null;

  const done = items.filter((i) => i.checked).length;

  const handleToggle = (idx: number) => {
    const updated = toggleChecklistItem(localHtml, idx);
    setLocalHtml(updated);       // Optimistic update — instant UI
    onToggle(idx, updated);      // Persist to server
  };

  return (
    <Box sx={{ fontSize: '0.875rem' }}>
      {/* Progress bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: 'action.hover',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${items.length > 0 ? (done / items.length) * 100 : 0}%`,
              bgcolor: done === items.length ? 'success.main' : 'primary.main',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {done}/{items.length}
        </Typography>
      </Box>

      {/* Checklist items */}
      {items.map((item, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            py: 0.25,
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { bgcolor: 'action.hover', borderRadius: 0.5 },
          }}
          onClick={() => handleToggle(i)}
        >
          <Checkbox
            checked={item.checked}
            size="small"
            sx={{ p: 0.25, pointerEvents: 'none' }}
            tabIndex={-1}
          />
          <Typography
            variant="body2"
            sx={{
              textDecoration: item.checked ? 'line-through' : 'none',
              color: item.checked ? 'text.disabled' : 'text.primary',
              transition: 'all 0.2s ease',
              lineHeight: 1.6,
            }}
          >
            {item.text}
          </Typography>
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

