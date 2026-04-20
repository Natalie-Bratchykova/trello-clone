import {t} from 'i18next';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Search from "@mui/icons-material/Search";
import Menu from "@mui/material/Menu";
import SwapVert from "@mui/icons-material/SwapVert";
import {ArrowDownward, ArrowUpward, FilterList} from "@mui/icons-material";
import {Chip, ListItemText, MenuItem, Typography} from "@mui/material";
import {memo, useState, useEffect, useRef} from "react";
import {useBoardFilter} from "../../../context/BoardFilterContext.tsx";
import {PRIORITY_SORT_LABELS, SORT_OPTIONS, PRIORITY_SORT_MODES} from "../../../helpers/utils/sortHelper.ts";
import AddListCard from "../AddListCart.tsx";
import BoardColumn from "../Logic/BoardColumn.tsx";


 function BoardMainContent (props){
     const {
         searchQuery, setSearchQuery,
         sortBy, setSortBy,
         sortDirection, setSortDirection,
         prioritySortMode, setPrioritySortMode,
         hasActiveFilters,
         totalCardCount, filteredCardCount,
         filteredLists,
         clearFilters,
     } = useBoardFilter();

     const [localSearch, setLocalSearch] = useState(searchQuery);
     const debounceRef = useRef<ReturnType<typeof setTimeout>>();

     useEffect(() => {
       setLocalSearch(searchQuery);
     }, [searchQuery]);

     const handleSearchChange = (value: string) => {
       setLocalSearch(value);
       clearTimeout(debounceRef.current);
       debounceRef.current = setTimeout(() => setSearchQuery(value), 250);
     };
     const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
     let {handleTicketsDnD, setCardDialogState, setSelectedCard, handleClearList, id, refetch} = props;


    return(
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Search + filter bar */}
            <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <TextField
                    size="small"
                    placeholder={t('filters.searchPlaceholder')}
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    sx={{ minWidth: 200, flex: { xs: 1, sm: 'unset' } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{fontSize: 20, color: 'text.secondary'}}/>
                                </InputAdornment>
                            ),

                        },
                    }}
                />

                {/* Users filter dropdown */}
                {props.children}

                {/* Sort dropdown */}
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Button
                    variant={sortBy !== 'none' ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<SwapVert sx={{ fontSize: 16 }} />}
                    endIcon={
                        sortBy !== 'none' ? (
                            sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />
                        ) : undefined
                    }
                    onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                >
                    {sortBy === 'priority'
                        ? `${t('filters.priorityFilter')}: ${PRIORITY_SORT_LABELS[prioritySortMode]}`
                        : sortBy !== 'none'
                            ? t(SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey || '')
                            : t('sort.title')}
                </Button>
                <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)}>
                    {SORT_OPTIONS.map((opt) => (
                        <MenuItem
                            key={opt.value}
                            selected={sortBy === opt.value}
                            onClick={() => {
                                if (opt.value === 'none') {
                                    setSortBy('none');
                                    setSortMenuAnchor(null);
                                } else if (opt.value === 'priority') {
                                    setSortBy('priority');
                                    // Don't close — let user pick mode below
                                } else if (sortBy === opt.value) {
                                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                    setSortMenuAnchor(null);
                                } else {
                                    setSortBy(opt.value);
                                    setSortDirection('desc');
                                    setSortMenuAnchor(null);
                                }
                            }}
                            dense
                        >
                            <ListItemText primary={t(opt.labelKey)} primaryTypographyProps={{ variant: 'body2' }} />
                            {sortBy === opt.value && opt.value !== 'none' && opt.value !== 'priority' && (
                                <Box sx={{ ml: 1 }}>
                                    {sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 16, color: 'primary.main' }} /> : <ArrowDownward sx={{ fontSize: 16, color: 'primary.main' }} />}
                                </Box>
                            )}
                        </MenuItem>
                    ))}
                    {sortBy === 'priority' && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                {t('sort.priorityOrder')}
                            </Typography>
                            {PRIORITY_SORT_MODES.map((mode) => (
                                <MenuItem
                                    key={mode}
                                    selected={prioritySortMode === mode}
                                    onClick={() => {
                                        setPrioritySortMode(mode);
                                        setSortMenuAnchor(null);
                                    }}
                                    dense
                                    sx={{ pl: 3 }}
                                >
                                    <ListItemText primary={PRIORITY_SORT_LABELS[mode]} primaryTypographyProps={{ variant: 'body2' }} />
                                    {prioritySortMode === mode && (
                                        <Box sx={{ ml: 1, color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>✓</Box>
                                    )}
                                </MenuItem>
                            ))}
                        </>
                    )}
                </Menu>

                {hasActiveFilters && (
                    <Chip
                        icon={<FilterList sx={{ fontSize: 16 }} />}
                        label={`${filteredCardCount} / ${totalCardCount}`}
                        size="small"
                        onDelete={clearFilters}
                        color="primary"
                        variant="outlined"
                    />
                )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        pb: 2,
                        minHeight: 'calc(100vh - 200px)',
                    }}
                >
                    {[...filteredLists]
                        .sort((a, b) => a.position - b.position)
                        .map((list) => (
                            <BoardColumn
                                onDrop={(item) => handleTicketsDnD(item, list)}
                                list={list}
                                key={list.id}
                                setCardDialogState={setCardDialogState}
                                onCardClick={(card, listTitle) => setSelectedCard({ card, listTitle })}
                                onListUpdated={() => refetch()}
                                externalSortActive={sortBy !== 'none'}
                                isBacklog={list.position === 0}
                                onClearList={handleClearList}
                            />
                        ))}

                    <AddListCard boardId={id} onListCreated={refetch}/>
                </Box>
            </Box>
        </Box>
    );
}

export default memo(BoardMainContent);