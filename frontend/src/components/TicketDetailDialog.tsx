import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Link,
  Button,
} from '@mui/material';
import { Close, CalendarToday, Person, Flag, AccessTime, Edit } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import CommentsSection from './CommentsSection';
import EditCardDialog from './EditCardDialog';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LOW: { label: 'Низький', color: '#2e7d32', bg: '#e8f5e9', icon: '🟢' },
  MEDIUM: { label: 'Середній', color: '#e65100', bg: '#fff3e0', icon: '🟠' },
  HIGH: { label: 'Високий', color: '#c62828', bg: '#ffebee', icon: '🔴' },
};

function getDueDateColors(dueDate: string): { bg: string; color: string } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)   return { bg: '#d32f2f', color: '#fff' };
  if (diffDays < 5)   return { bg: '#ffebee', color: '#c62828' };
  if (diffDays < 14)  return { bg: '#fff3e0', color: '#e65100' };
  if (diffDays < 30)  return { bg: '#fff9c4', color: '#f57f17' };
  return { bg: '#e8f5e9', color: '#2e7d32' };
}

function getDueDateLabel(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Прострочено на ${Math.abs(diffDays)} дн.`;
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Завтра';
  if (diffDays < 7) return `Через ${diffDays} дн.`;
  if (diffDays < 30) return `Через ${Math.floor(diffDays / 7)} тижн.`;
  return `Через ${Math.floor(diffDays / 30)} міс.`;
}

export interface TicketDetailCard {
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

interface TicketDetailDialogProps {
  open: boolean;
  onClose: () => void;
  card: TicketDetailCard | null;
  listTitle?: string;
  onCardUpdated?: () => void;
}

export default function TicketDetailDialog({ open, onClose, card, listTitle, onCardUpdated }: TicketDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false);

  if (!card) return null;

  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2, maxHeight: '90vh' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1, pr: 2 }}>
          {card.suffix && (
            <Link
              component={RouterLink}
              to={`/task/${card.id}`}
              underline="hover"
              sx={{ fontWeight: 600, mb: 0.5, display: 'block', fontSize: '0.75rem' }}
            >
              {card.suffix}
            </Link>
          )}
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {card.title}
          </Typography>
          {listTitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              у списку <strong>{listTitle}</strong>
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={() => setEditOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Редагувати
          </Button>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Main content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Description */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Опис
            </Typography>
            {card.description ? (
              <Box
                sx={{
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  '& p': { m: 0, mb: 1 },
                  '& p:last-child': { mb: 0 },
                  '& ul, & ol': { pl: 3, m: 0, mb: 1, listStylePosition: 'outside' },
                  '& li': { wordBreak:'break-word' },
                  '& h1, & h2, & h3': { mt: 1, mb: 0.5 },
                  '& blockquote': {
                    borderLeft: '3px solid',
                    borderColor: 'divider',
                    pl: 2,
                    ml: 0,
                    color: 'text.secondary',
                  },
                  '& pre': {
                    backgroundColor: 'grey.900',
                    color: 'grey.100',
                    p: 1.5,
                    borderRadius: 1,
                    overflow: 'auto',
                  },
                  '& a': { color: 'primary.main' },
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                }}
                dangerouslySetInnerHTML={{ __html: card.description }}
              />
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                Опис відсутній
              </Typography>
            )}

            {/* Comments */}
            <Divider sx={{ my: 3 }} />
            <CommentsSection cardId={card.id} />
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }}>
            {/* Priority */}
            {priorityConfig && (
              <DetailField icon={<Flag sx={{ fontSize: 18 }} />} label="Пріоритет">
                <Chip
                  label={`${priorityConfig.icon} ${priorityConfig.label}`}
                  size="small"
                  sx={{
                    backgroundColor: priorityConfig.bg,
                    color: priorityConfig.color,
                    fontWeight: 600,
                  }}
                />
              </DetailField>
            )}

            {/* Due Date */}
            {card.dueDate && (() => {
              const dueDateColors = getDueDateColors(card.dueDate!);
              return (
                <DetailField icon={<CalendarToday sx={{ fontSize: 18 }} />} label="Дедлайн">
                  <Box>
                    <Chip
                      label={new Date(card.dueDate!).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      size="small"
                      sx={{
                        backgroundColor: dueDateColors.bg,
                        color: dueDateColors.color,
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {getDueDateLabel(card.dueDate!)}
                    </Typography>
                  </Box>
                </DetailField>
              );
            })()}

            {/* Assignee */}
            {card.user && (
              <DetailField icon={<Person sx={{ fontSize: 18 }} />} label="Виконавець">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={card.user.profileImage ? `http://localhost:3000${card.user.profileImage}` : undefined}
                    sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}
                  >
                    {!card.user.profileImage && card.user.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                      {card.user.name}
                    </Typography>
                    {card.user.email && (
                      <Typography variant="caption" color="text.secondary">
                        {card.user.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </DetailField>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Timestamps */}
            {card.createdAt && (
              <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label="Створено">
                <Typography variant="body2" color="text.secondary">
                  {new Date(card.createdAt).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </DetailField>
            )}
            {card.updatedAt && (
              <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label="Оновлено">
                <Typography variant="body2" color="text.secondary">
                  {new Date(card.updatedAt).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </DetailField>
            )}
          </Box>
        </Box>
      </DialogContent>

      <EditCardDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        card={card ? {
          id: card.id,
          title: card.title,
          description: card.description,
          priority: card.priority,
          dueDate: card.dueDate,
          userId: card.user?.id,
          user: card.user || null,
        } : null}
        onCardUpdated={() => {
          setEditOpen(false);
          onCardUpdated?.();
        }}
      />
    </Dialog>
  );
}

function DetailField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

