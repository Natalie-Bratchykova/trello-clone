import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';


interface TaskBreadcrumbsProps {
  card: {
    suffix?: string;
    title: string;
    list?: {
      title: string;
      board?: {
        id: string;
        title: string;
      };
    };
  };
  t: any;
}

export default function TaskBreadcrumbs({ card, t }: TaskBreadcrumbsProps) {
  return (
    <Breadcrumbs sx={{ mb: 3 }}>
      <Link component={RouterLink} to="/projects" underline="hover" color="inherit">
        {t('navbar.projects')}
      </Link>
      {card.list?.board && (
        <Link component={RouterLink} to={`/board/${card.list.board.id}`} underline="hover" color="inherit">
          {card.list.board.title}
        </Link>
      )}
      {card.list && (
        <Typography color="text.secondary">{card.list.title}</Typography>
      )}
      <Typography color="text.primary" fontWeight={600}>
        {card.suffix || card.title}
      </Typography>
    </Breadcrumbs>
  );
}

