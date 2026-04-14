import {memo} from "react";
import {
    Box,
    Checkbox,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography
} from "@mui/material";
import {t} from "i18next";

function ReleaseTasksSelector(props){
    let {parentCardOptions,
        selectedReleaseTaskIds,
        setSelectedReleaseTaskIds} = props;
    console.log('parentCardOptions', parentCardOptions);




    return(
        <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('release.selectTasks')}
            </Typography>
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: 220,
                    overflow: 'auto',
                }}
            >
                <List dense disablePadding>
                    {parentCardOptions.map((card) => {
                        const isSelected = selectedReleaseTaskIds.includes(card.id);
                        return (
                            <ListItem key={card.id} disablePadding>
                                <ListItemButton
                                    onClick={() => {
                                        setSelectedReleaseTaskIds((prev) =>
                                            isSelected
                                                ? prev.filter((id) => id !== card.id)
                                                : [...prev, card.id],
                                        );
                                    }}
                                    dense
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={isSelected}
                                            tabIndex={-1}
                                            disableRipple
                                            size="small"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {card.suffix && (
                                                    <Chip label={card.suffix} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                )}
                                                <Typography variant="body2" noWrap>{card.title}</Typography>
                                            </Box>
                                        }
                                        secondary={card.listTitle}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
            {selectedReleaseTaskIds.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {t('release.selectedCount', { count: selectedReleaseTaskIds.length })}
                </Typography>
            )}
        </Box>
    )
}

export default memo(ReleaseTasksSelector);