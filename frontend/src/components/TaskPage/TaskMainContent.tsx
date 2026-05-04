import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import CommentsSection from '../CommentsSection';
import TextEditorUneditable from '../Ticket/TextEditorUneditable';
import ReleaseIncludingTask from '../Ticket/Release/ReleaseIncludingTasks';
import { definePriorityLabel } from '../../helpers/utils/color';

interface ReleaseTask {
  id: string;
  title: string;
  listId: string;
  list?: {
    id: string;
    title: string;
  };
}
interface TaskMainContentProps {
  card: {
    id: string;
    title: string;
    description?: string;
    type?: string;
    releaseTasks?: ReleaseTask[];
    parent?: {
      id: string;
      title: string;
      suffix?: string;
    };
    children?: {
      id: string;
      title: string;
      suffix?: string;
      priority?: string;
      dueDate?: string;
      user?: {
        id: string;
        name: string;
      };
    }[];
  };
  displayReleaseTasks: any[];
  t: any;
}


export default function TaskMainContent({ card, displayReleaseTasks, t }: TaskMainContentProps) {
  return (
    <>
      {/* Description */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {t('ticketDetail.description')}
        </Typography>
        {card.description ? (
          <TextEditorUneditable html={card.description} />
        ) : (
          <Typography variant="body1" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            {t('ticketDetail.noDescription')}
          </Typography>
        )}
      </Paper>

      {/* Release Tasks */}
      {card.type === 'RELEASE' && displayReleaseTasks.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <ReleaseIncludingTask displayReleaseTasks={displayReleaseTasks} />
        </Paper>
      )}

      {/* Parent task */}
      {card.parent && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('parentTask.title')}
          </Typography>
          <Box
            component={RouterLink}
            to={`/task/${card.parent.id}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            {card.parent.suffix && (
              <Chip label={card.parent.suffix} size="small" color="primary" variant="outlined" />
            )}
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {card.parent.title}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Children subtasks */}
      {card.children && card.children.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('ticketDetail.subtasks', { count: card.children.length })}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {card.children.map((child) => (
              <Box
                key={child.id}
                component={RouterLink}
                to={`/task/${child.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {child.suffix && (
                  <Chip label={child.suffix} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {child.title}
                </Typography>
                {child.priority && (
                  <Chip label={definePriorityLabel(child.priority)} size="small" sx={{ minWidth: 0, flexShrink: 0 }} />
                )}
                {child.user && (
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', flexShrink: 0 }}>
                    {child.user.name?.[0]?.toUpperCase()}
                  </Avatar>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Comments */}
      <Paper sx={{ p: 3 }}>
        <CommentsSection cardId={card.id} cardDescription={card.description} />
      </Paper>
    </>
  );
}

