import {Link as RouterLink} from "react-router";
import {Chip, Link, Typography} from "@mui/material";
import {definePriorityLabel} from "../../helpers/utils/color.ts";


export default function SubTask({child}) {
  return (
      <Link
          component={RouterLink}
          to={`/task/${child.id}`}
          underline="none"
          sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              color: 'inherit',
              '&:hover': { backgroundColor: 'action.hover' },
          }}
      >
          {child.suffix && (
              <Chip label={child.suffix} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {child.title}
          </Typography>
          {child.priority && (
              <Chip
                  label={definePriorityLabel(child.priority)}
                  size="small"
                  sx={{ minWidth: 0, flexShrink: 0 }}
              />
          )}
      </Link>
  );
}
