import { Box, Typography, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AccountTree } from '@mui/icons-material';
import TextEditorUneditable from '../Ticket/TextEditorUneditable';
import SubTask from '../Ticket/SubTask';
import ReleaseIncludingTask from '../Ticket/Release/ReleaseIncludingTasks';
import CommentsSection from '../CommentsSection';

interface DialogMainContentProps {
  card: {
    id: string;
    description?: string;
    type?: string;
    parent?: {
      id: string;
      title: string;
      suffix?: string;
    };
    children?: Array<{
      id: string;
      title: string;
      suffix?: string;
      priority?: string;
      dueDate?: string;
      user?: {
        id: string;
        name: string;
      };
    }>;
  };
  displayReleaseTasks: any[];
  t: any;
}

export default function DialogMainContent({ card, displayReleaseTasks, t }: DialogMainContentProps) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {/* Description */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
        {t('ticketDetail.description')}
      </Typography>
      {card.description ? (
        <TextEditorUneditable html={card.description} />
      ) : (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
          {t('ticketDetail.noDescription')}
        </Typography>
      )}

      {/* Parent task */}
      {card.parent && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
            {t('parentTask.title')}
          </Typography>
          <Box
            component={RouterLink}
            to={`/task/${card.parent.id}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <AccountTree sx={{ fontSize: 16, color: 'text.secondary' }} />
            {card.parent.suffix && (
              <Chip label={card.parent.suffix} size="small" color="primary" variant="outlined" />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {card.parent.title}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Children subtasks */}
      {card.children && card.children.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
            {t('ticketDetail.subtasks', { count: card.children.length })}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {card.children.map((child) => (
              <SubTask child={child} key={child.id} />
            ))}
          </Box>
        </Box>
      )}

      {/* Release Tasks */}
      {card.type === 'RELEASE' && displayReleaseTasks && displayReleaseTasks.length > 0 && (
        <ReleaseIncludingTask displayReleaseTasks={displayReleaseTasks} />
      )}

      {/* Comments */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 3, pt: 3 }}>
        <CommentsSection cardId={card.id} cardDescription={card.description} />
      </Box>
    </Box>
  );
}

