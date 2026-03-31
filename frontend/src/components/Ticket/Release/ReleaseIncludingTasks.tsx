import {Avatar, Box, Chip, Link, Typography} from "@mui/material";
import {Link as RouterLink} from "react-router";
import {t} from "i18next";

interface ReleaseIncludingTaskProps {
    displayReleaseTasks?: {
        id: string;
        title: string;
        suffix?: string;
        priority?: string;
        listId?: string;
        user?: { id: string; name: string; profileImage?: string };
        list?: { id: string; title: string }
    }[]
}

export default function ReleaseIncludingTask({displayReleaseTasks}:ReleaseIncludingTaskProps) {
    return (
        <Box sx={{mb: 2}}>
            <Typography variant="subtitle2" sx={{fontWeight: 600, mb: 1, color: 'text.secondary'}}>
                🚀 {t('release.linkedTasks')} ({displayReleaseTasks.length})
            </Typography>
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 120px 100px',
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        bgcolor: 'action.hover',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="caption"
                                sx={{fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>
                        {t('release.colId')}
                    </Typography>
                    <Typography variant="caption"
                                sx={{fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>
                        {t('release.colName')}
                    </Typography>
                    <Typography variant="caption"
                                sx={{fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>
                        {t('release.colStatus')}
                    </Typography>
                    <Typography variant="caption"
                                sx={{fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>
                        {t('release.colExecutor')}
                    </Typography>
                </Box>
                {/* Rows */}
                {displayReleaseTasks.map((rt) => (
                    <Box
                        key={rt.id}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '100px 1fr 120px 100px',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {borderBottom: 'none'},
                            alignItems: 'center',
                            '&:hover': {bgcolor: 'action.hover'},
                        }}
                    >
                        <Link
                            component={RouterLink}
                            to={`/task/${rt.id}`}
                            underline="hover"
                            sx={{fontSize: '0.75rem', fontWeight: 600}}
                        >
                            {rt.suffix || rt.id.slice(0, 8)}
                        </Link>
                        <Typography variant="body2" noWrap sx={{fontWeight: 500}}>
                            {rt.title}
                        </Typography>
                        <Chip
                            label={rt.list?.title || '—'}
                            size="small"
                            variant="outlined"
                            sx={{height: 22, fontSize: '0.7rem'}}
                        />
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                            {rt.user ? (
                                <>
                                    <Avatar
                                        src={rt.user.profileImage ? `http://localhost:3000${rt.user.profileImage}` : undefined}
                                        sx={{width: 20, height: 20, fontSize: '0.65rem', bgcolor: 'primary.main'}}
                                    >
                                        {!rt.user.profileImage && rt.user.name?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <Typography variant="caption" noWrap>{rt.user.name}</Typography>
                                </>
                            ) : (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}