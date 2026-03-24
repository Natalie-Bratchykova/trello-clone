import {Avatar, Button, Checkbox, Chip, ListItemText, Menu, MenuItem, Typography} from "@mui/material";
import {Person} from "@mui/icons-material";
import {useState} from "react";
import {t} from "i18next";

export default function FilterItem({filterTitle, filterSubtitle, selectedItems,itemAnchor, setItemAnchor, isUserFilter=false, renderItem, results, toggleState}){

    let buttonVariant = selectedItems.length > 0 ? 'contained' : 'outlined';

    return(<>
        <Button
            variant={buttonVariant}
            size="small"
            startIcon={<Person sx={{ fontSize: 16 }} />}
            endIcon={
                selectedItems.length > 0 ? (
                    <Chip label={selectedItems.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.3)', color: 'inherit' }} />
                ) : undefined
            }
            onClick={(e) => setItemAnchor(e.currentTarget)}
            sx={{ textTransform: 'none', fontSize: '0.8rem' }}
        >
            {t(filterTitle)}
        </Button>
        <Menu
            anchorEl={itemAnchor}
            open={Boolean(itemAnchor)}
            onClose={() => setItemAnchor(null)}
            slotProps={{ paper: { sx: { maxHeight: 320, minWidth: 220 } } }}
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
                        <Checkbox size="small" checked={selectedItems.includes(item.id || item[0])} sx={{ p: 0, mr: 1 }} />
                        {renderItem ? renderItem(item) : null}
                    </MenuItem>
                ))
            )}
        </Menu>
    </>)
}