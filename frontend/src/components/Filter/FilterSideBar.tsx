import {
    Avatar,
    Box, Button,
    Chip, Divider,
    List as MuiList,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText, Paper,
    Typography
} from "@mui/material";
import {FolderSpecial, PersonOutline, SwapVert, ViewColumn} from "@mui/icons-material";
import {PRIORITY_OPTIONS} from "../../helpers/utils/color.ts";
import {SORT_OPTIONS} from "../../helpers/utils/sortHelper.ts";
import {t} from "i18next";
import {useMemo, useState} from "react";
import FilterSideBarChip from "./FilterSideBarChip.tsx";
export default function FilterSideBar({board, hasActiveFilters, showOnlyMine, setShowOnlyMine, currentUser, activeFiltersCount, selectedUsers, toggleUser, allBoardUsers, selectedPriorities, togglePriority, sortBy, filteredCardCount, totalCardCount, clearFilters}) {

    const myCardCount = useMemo(() => {
        if (!board?.lists || !currentUser?.id) return 0;
        return board.lists.reduce(
            (sum, list) => sum + list.cards.filter((c) => c.user?.id === currentUser.id).length,
            0,
        );
    }, [board, currentUser?.id]);


    return(<Paper
        elevation={0}
        sx={{
            width: 240,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 72px)',
        }}
    >
        <Box sx={{ p: 2 }}>
            <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, fontSize: '0.7rem' }}
            >
                {t('filters.title')}
            </Typography>
            <MuiList disablePadding>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={!showOnlyMine}
                        onClick={() => setShowOnlyMine(false)}
                        sx={{ borderRadius: 1, py: 0.75 }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <ViewColumn sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={t('filters.allTasks')} primaryTypographyProps={{ variant: 'body2', fontWeight: !showOnlyMine ? 600 : 400 }} />
                        <Chip label={totalCardCount} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={showOnlyMine}
                        onClick={() => setShowOnlyMine(true)}
                        sx={{ borderRadius: 1, py: 0.75 }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <FolderSpecial sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={t('filters.myTasks')} primaryTypographyProps={{ variant: 'body2', fontWeight: showOnlyMine ? 600 : 400 }} />
                        <Chip label={myCardCount} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </ListItemButton>
                </ListItem>
            </MuiList>
        </Box>

        <Divider />

        {/* Active filters summary in sidebar */}
        {activeFiltersCount > 0 && (
            <Box sx={{ p: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, fontSize: '0.7rem' }}
                >
                    {t('filters.activeFilters')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {showOnlyMine && (
                        <Chip
                            label={t('filters.myTasks')}
                            size="small"
                            onDelete={() => setShowOnlyMine(false)}
                            icon={<PersonOutline sx={{ fontSize: 14 }} />}
                            sx={{ fontSize: '0.75rem' }}
                        />
                    )}
                    <FilterSideBarChip
                        options={selectedUsers}
                        filterOptions={allBoardUsers}
                        toggleState={toggleUser}
                        renderItem={
                        (user)=>
                            <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem' }} src={user.profileImage ? `http://localhost:3000${user.profileImage}` : undefined}>
                        {user.name[0]}
                    </Avatar>}
                    />
                    <FilterSideBarChip options={selectedPriorities} filterOptions={PRIORITY_OPTIONS} toggleState={togglePriority}/>
                    {sortBy !== 'none' && (
                        <Chip
                            label={`${SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey ? t(SORT_OPTIONS.find((o) => o.value === sortBy)!.labelKey) : ''} ${sortDirection === 'asc' ? '↑' : '↓'}`}
                            size="small"
                            icon={<SwapVert sx={{ fontSize: 14 }} />}
                            onDelete={() => setSortBy('none')}
                            sx={{ fontSize: '0.75rem' }}
                        />
                    )}
                </Box>
                <Button size="small" onClick={clearFilters} sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem' }}>
                    {t('common.clearAll')}
                </Button>
            </Box>
        )}

        {/* Filtered count */}
        {hasActiveFilters && (
            <>
                <Divider />
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('filters.shown')}: <strong>{filteredCardCount}</strong> {t('filters.of')} {totalCardCount} {t('filters.tasks')}
                    </Typography>
                </Box>
            </>
        )}
    </Paper>)
}