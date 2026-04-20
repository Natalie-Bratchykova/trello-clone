import { Box, Chip, Typography, Avatar, Divider, FormControl, Select, MenuItem, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { CalendarToday, Person, Flag, AccessTime, List as ListIcon, Dashboard, PersonAdd } from '@mui/icons-material';
import SidebarField from './SidebarField';
import { getDueDateColors, getDueDateLabel } from '../../helpers/utils/color';
import { formatDate } from '../../helpers/utils/dateLocale';
import { getUserProfileUrl } from '../../helpers/utils/userHelper';

interface TaskSidebarProps {
  card: {
    id: string;
    listId: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    list?: {
      id: string;
      title: string;
      board?: {
        id: string;
        title: string;
        color: string;
      };
    };
    user?: {
      id: string;
      name: string;
      email?: string;
      profileImage?: string;
    };
  };
  boardLists: Array<{ id: string; title: string; position: number }>;
  priorityConfig: {
    icon: string;
    labelKey: string;
    bg: string;
    color: string;
  } | null;
  isAssignedToMe: boolean;
  currentUser: { id: string } | null;
  updatingList: boolean;
  assigningUser: boolean;
  onListChange: (listId: string) => void;
  onAssignMe: () => void;
  t: any;
  i18n: { language: string };
}

export default function TaskSidebar({
  card,
  boardLists,
  priorityConfig,
  isAssignedToMe,
  currentUser,
  updatingList,
  assigningUser,
  onListChange,
  onAssignMe,
  t,
  i18n,
}: TaskSidebarProps) {
  return (
    <>
      {/* Status / List */}
      {card.list && (
        <SidebarField icon={<ListIcon sx={{ fontSize: 18 }} />} label={t('task.list')}>
          {boardLists.length > 0 ? (
            <FormControl size="small" fullWidth>
              <Select
                value={card.listId}
                onChange={(e) => onListChange(e.target.value as string)}
                disabled={updatingList}
                variant="outlined"
                sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { py: 0.75, px: 1.5 } }}
              >
                {boardLists.map((list) => (
                  <MenuItem key={list.id} value={list.id}>
                    {list.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Chip label={card.list.title} size="small" variant="outlined" />
          )}
        </SidebarField>
      )}

      {/* Board */}
      {card.list?.board && (
        <SidebarField icon={<Dashboard sx={{ fontSize: 18 }} />} label={t('task.project')}>
          <Chip
            label={card.list.board.title}
            size="small"
            component={RouterLink}
            to={`/board/${card.list.board.id}`}
            clickable
            sx={{ backgroundColor: card.list.board.color, color: 'white', fontWeight: 600 }}
          />
        </SidebarField>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Priority */}
      {priorityConfig && (
        <SidebarField icon={<Flag sx={{ fontSize: 18 }} />} label={t('priority.label')}>
          <Chip
            label={`${priorityConfig.icon} ${t(priorityConfig.labelKey)}`}
            size="small"
            sx={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color, fontWeight: 600 }}
          />
        </SidebarField>
      )}

      {/* Due Date */}
      {card.dueDate && (() => {
        const dueDateColors = getDueDateColors(card.dueDate);
        return (
          <SidebarField icon={<CalendarToday sx={{ fontSize: 18 }} />} label={t('dueDate.deadline')}>
            <Box>
              <Chip
                label={formatDate(i18n.language, card.dueDate, false)}
                size="small"
                sx={{ backgroundColor: dueDateColors.bg, color: dueDateColors.color, fontWeight: 600 }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {getDueDateLabel(card.dueDate, t)}
              </Typography>
            </Box>
          </SidebarField>
        );
      })()}

      {/* Assignee */}
      {card.user && (
        <>
          <Divider sx={{ my: 2 }} />
          <SidebarField icon={<Person sx={{ fontSize: 18 }} />} label={t('filters.assignees')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={getUserProfileUrl(card.user.profileImage)}
                sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main' }}
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
          </SidebarField>
        </>
      )}

      {/* Assign to me */}
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

      <Divider sx={{ my: 2 }} />

      {/* Timestamps */}
      <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.createdAt')}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(i18n.language, card.createdAt)}
        </Typography>
      </SidebarField>
      <SidebarField icon={<AccessTime sx={{ fontSize: 18 }} />} label={t('ticketDetail.updatedAt')}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(i18n.language, card.updatedAt)}
        </Typography>
      </SidebarField>
    </>
  );
}

