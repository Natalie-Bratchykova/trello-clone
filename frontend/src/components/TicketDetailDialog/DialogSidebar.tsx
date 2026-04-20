import { Box, Typography, Chip, Avatar, Divider, Button, FormControl, Select, MenuItem } from '@mui/material';
import { CalendarToday, Person, Flag, AccessTime, PersonAdd, List as ListIcon } from '@mui/icons-material';
import DetailField from '../Ticket/DetailField';
import { getDueDateColors, getDueDateLabel } from '../../helpers/utils/color';
import { formatDate } from '../../helpers/utils/dateLocale';
import { getUserProfileUrl } from '../../helpers/utils/userHelper';

interface DialogSidebarProps {
  card: {
    id: string;
    priority?: string;
    dueDate?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  priorityConfig: {
    icon: string;
    labelKey: string;
    bg: string;
    color: string;
  } | null;
  displayUser: {
    id: string;
    name: string;
    email?: string;
    profileImage?: string;
  } | null;
  displayListId: string;
  displayListTitle: string;
  boardLists: Array<{ id: string; title: string; position: number }>;
  isAssignedToMe: boolean;
  currentUser: { id: string } | null;
  updatingList: boolean;
  assigningUser: boolean;
  onListChange: (listId: string) => void;
  onAssignMe: () => void;
  t: any;
  i18n: { language: string };
}

export default function DialogSidebar({
  card,
  priorityConfig,
  displayUser,
  displayListId,
  displayListTitle,
  boardLists,
  isAssignedToMe,
  currentUser,
  updatingList,
  assigningUser,
  onListChange,
  onAssignMe,
  t,
  i18n,
}: DialogSidebarProps) {
  return (
    <Box sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }}>
      {/* Priority */}
      {priorityConfig && (
        <DetailField icon={<Flag sx={{ fontSize: 18 }} />} label={t('priority.label')}>
          <Chip
            label={`${priorityConfig.icon} ${t(priorityConfig.labelKey)}`}
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
        const dueDateColors = getDueDateColors(card.dueDate);
        return (
          <DetailField icon={<CalendarToday sx={{ fontSize: 18 }} />} label={t('dueDate.deadline')}>
            <Box>
              <Chip
                label={formatDate(i18n.language, card.dueDate, false)}
                size="small"
                sx={{
                  backgroundColor: dueDateColors.bg,
                  color: dueDateColors.color,
                  fontWeight: 600,
                }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {getDueDateLabel(card.dueDate, t)}
              </Typography>
            </Box>
          </DetailField>
        );
      })()}

      {/* Assignee */}
      {displayUser && (
        <DetailField icon={<Person sx={{ fontSize: 18 }} />} label={t('filters.assignees')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={getUserProfileUrl(displayUser.profileImage)}
              sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}
            >
              {!displayUser.profileImage && displayUser.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                {displayUser.name}
              </Typography>
              {displayUser.email && (
                <Typography variant="caption" color="text.secondary">
                  {displayUser.email}
                </Typography>
              )}
            </Box>
          </Box>
        </DetailField>
      )}

      {/* Assign to me button */}
      {!isAssignedToMe && currentUser?.id && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
          onClick={onAssignMe}
          disabled={assigningUser}
          fullWidth
          sx={{ textTransform: 'none', mb: 2 }}
        >
          {assigningUser ? t('assignee.assigning') : t('assignee.assignMe')}
        </Button>
      )}

      {/* List / Status selector */}
      <DetailField icon={<ListIcon sx={{ fontSize: 18 }} />} label={t('task.list')}>
        {boardLists.length > 0 ? (
          <FormControl size="small" fullWidth>
            <Select
              value={displayListId}
              onChange={(e) => onListChange(e.target.value as string)}
              disabled={updatingList}
              variant="outlined"
              sx={{
                fontSize: '0.875rem',
                '& .MuiSelect-select': { py: 0.75, px: 1.5 },
              }}
            >
              {boardLists.map((list) => (
                <MenuItem key={list.id} value={list.id}>
                  {list.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip label={displayListTitle} size="small" variant="outlined" />
        )}
      </DetailField>

      <Divider sx={{ my: 2 }} />

      {/* Timestamps */}
      {card.createdAt && (
        <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.createdAt')}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(i18n.language, card.createdAt)}
          </Typography>
        </DetailField>
      )}
      {card.updatedAt && (
        <DetailField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.updatedAt')}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(i18n.language, card.updatedAt)}
          </Typography>
        </DetailField>
      )}
    </Box>
  );
}

