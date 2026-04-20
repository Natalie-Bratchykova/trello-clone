import {Button, Checkbox, Chip, Menu, MenuItem, Typography} from "@mui/material";
import {FilterList, Person, PriorityHighOutlined} from "@mui/icons-material";
import {t} from "i18next";
import React from "react";


interface FilterItemProps {
    filterSubtitle?: string,
    selectedItems: (string | number)[],
    itemAnchor: HTMLElement | null,
    setItemAnchor: (anchor: HTMLElement | null) => void,
    isUserFilter?: boolean,
    renderItem?: (item: any) => React.ReactNode,
    results: any[],
    toggleState: (id: string | number) => void,
    filterTitle?: string
}

export default function FilterItemComponent({
                                       filterSubtitle,
                                       selectedItems,
                                       itemAnchor,
                                       setItemAnchor,
                                       isUserFilter = false,
                                       renderItem,
                                       results,
                                       toggleState,
                                       filterTitle
                                   }: FilterItemProps) {

    let buttonVariant = selectedItems.length > 0 ? 'contained' : 'outlined';
    let filterIcon = isUserFilter ? <Person sx={{fontSize: 16}}/>:<FilterList/>;

    return (<>
        <Button
            variant={buttonVariant}
            size="small"
            startIcon={filterIcon}
            endIcon={
                selectedItems.length > 0 ? (
                    <Chip label={selectedItems.length} size="small"
                          sx={{height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.3)', color: 'inherit'}}/>
                ) : undefined
            }
            onClick={(e) => setItemAnchor(e.currentTarget)}
            sx={{textTransform: 'none', fontSize: '0.8rem'}}
        >
            {t(filterTitle)}
        </Button>
        <Menu
            anchorEl={itemAnchor}
            open={Boolean(itemAnchor)}
            onClose={() => setItemAnchor(null)}
            slotProps={{paper: {sx: {maxHeight: 320, minWidth: 220}}}}
        >
            {isUserFilter && results.length === 0 ? (
                <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                        {t(filterSubtitle)}
                    </Typography>
                </MenuItem>
            ) : (
                results.map((item) => (
                    <MenuItem key={item.id || item[0]} onClick={() => toggleState(item.id || item[0])} dense>
                        <Checkbox size="small" checked={selectedItems.includes(item.id || item[0])} sx={{p: 0, mr: 1}}/>
                        {renderItem ? renderItem(item) : null}
                    </MenuItem>
                ))
            )}
        </Menu>
    </>)
}