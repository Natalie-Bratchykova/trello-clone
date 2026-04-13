import {
    Autocomplete, Avatar,
    Box, Button, Checkbox, Chip,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle, FormControl,
    IconButton, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import {Close, RocketLaunch, Task} from "@mui/icons-material";
import ReactQuill from "react-quill-new";
import {QUILL_FORMATS, QUILL_MODULES} from "../../../helpers/utils/textEditorHelper.ts";
import {PRIORITY_OPTIONS} from "../../../helpers/utils/color.ts";
import {useTranslation} from "react-i18next";

interface User {
    id: string;
    name: string;
    email: string;
}
interface ParentCardOption {
    id: string;
    title: string;
    suffix?: string;
    listTitle?: string;
}
export default  function CreateCartVisual(props){
    const { t } = useTranslation();
    const {
        handleClose,
        listTitle,
        open,
        loading,
        handleSubmit,
        cardType,
        setCardType,
        title,
        setTitle,
        errors,
        description,
        setDescription,
        priority,
        setPriority,
        users,
        assignee,
        setAssignee,
        usersLoading,
        boardId,
        parentTask,
        setParentTask,
        parentCardOptions,
        selectedReleaseTaskIds,
        setSelectedReleaseTaskIds,
        dueDate,
        setDueDate
    } = props;
    return( <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Box component="span" sx={{ display: 'block', fontSize: '1.25rem', fontWeight: 600 }}>
                        {t('createCard.title')}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {t('createCard.inList', { listTitle })}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={loading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {/* Card Type Toggle */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {t('createCard.cardType')}
                        </Typography>
                        <ToggleButtonGroup
                            value={cardType}
                            exclusive
                            onChange={(_, val) => val && setCardType(val)}
                            size="small"
                            fullWidth
                            disabled={loading}
                        >
                            <ToggleButton value="TASK" sx={{ textTransform: 'none', gap: 0.5 }}>
                                <Task fontSize="small" /> {t('cardType.task')}
                            </ToggleButton>
                            <ToggleButton value="RELEASE" sx={{ textTransform: 'none', gap: 0.5 }}>
                                <RocketLaunch fontSize="small" /> {t('cardType.release')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <TextField
                        autoFocus
                        fullWidth
                        label={t('createCard.cardName')}
                        placeholder={t('createCard.cardNamePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        error={!!errors.title}
                        helperText={errors.title}
                        margin="normal"
                        disabled={loading}
                    />

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {t('createCard.descriptionOptional')}
                        </Typography>
                        <Box
                            sx={{
                                '& .ql-container': {
                                    minHeight: 120,
                                    fontSize: '0.95rem',
                                    borderBottomLeftRadius: 4,
                                    borderBottomRightRadius: 4,
                                },
                                '& .ql-toolbar': {
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                },
                                '& .ql-editor': {
                                    minHeight: 120,
                                },
                            }}
                        >
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                modules={QUILL_MODULES()}
                                formats={QUILL_FORMATS()}
                                placeholder={t('createCard.descriptionPlaceholder')}
                                readOnly={loading}
                            />
                        </Box>
                    </Box>

                    <FormControl fullWidth margin="normal">
                        <InputLabel id="priority-label">{t('priority.label')}</InputLabel>
                        <Select
                            labelId="priority-label"
                            value={priority}
                            label={t('priority.label')}
                            onChange={(e) => setPriority(e.target.value as string)}
                            disabled={loading}
                        >
                            {PRIORITY_OPTIONS.map((option) => (
                                <MenuItem key={option[0]} value={option[0]}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: option[1].color,
                                            }}
                                        />
                                        {t(option[1].labelKey)}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Autocomplete<User>
                        options={users}
                        value={assignee}
                        onChange={(_, newValue) => setAssignee(newValue)}
                        getOptionLabel={(option) => option.name || option.email}
                        loading={usersLoading}
                        disabled={loading}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterOptions={(options, { inputValue }) => {
                            const filter = inputValue.toLowerCase();
                            return options.filter(
                                (user) =>
                                    (user.name || '').toLowerCase().includes(filter) ||
                                    user.email.toLowerCase().includes(filter),
                            );
                        }}
                        renderOption={({ key, ...props }, option) => (
                            <li key={option.id} {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                                    {option.profileImage ?
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }} src={option.profileImage? `http://localhost:3000${option.profileImage}`: undefined}/> :
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                            {(option.name || option.email).charAt(0).toUpperCase()}
                                        </Avatar>
                                    }
                                    <Box>
                                        <Typography variant="body2">{option.name || t('common.noName')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                                    </Box>
                                </Box>
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('assignee.label')}
                                placeholder={t('assignee.placeholder')}
                                margin="normal"
                            />
                        )}
                    />

                    {/* Parent task selector */}
                    {boardId && (
                        <Autocomplete<ParentCardOption>
                            options={parentCardOptions}
                            value={parentTask}
                            onChange={(_, newValue) => setParentTask(newValue)}
                            getOptionLabel={(option) =>
                                option.suffix ? `${option.suffix} — ${option.title}` : option.title
                            }
                            disabled={loading}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            groupBy={(option) => option.listTitle || ''}
                            filterOptions={(options, { inputValue }) => {
                                const filter = inputValue.toLowerCase();
                                return options.filter(
                                    (o) =>
                                        o.title.toLowerCase().includes(filter) ||
                                        (o.suffix || '').toLowerCase().includes(filter),
                                );
                            }}
                            renderOption={({ key, ...props }, option) => (
                                <li key={option.id} {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                        {option.suffix && (
                                            <Chip label={option.suffix} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
                                        )}
                                        <Typography variant="body2" noWrap>{option.title}</Typography>
                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('parentTask.label')}
                                    placeholder={t('parentTask.placeholder')}
                                    margin="normal"
                                />
                            )}
                        />
                    )}

                    {/* Release tasks selector — shown only for RELEASE type */}
                    {cardType === 'RELEASE' && boardId && parentCardOptions.length > 0 && (
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
                    )}

                    <TextField
                        fullWidth
                        label={t('dueDate.label')}
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        margin="normal"
                        disabled={loading}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? t('common.creating') : t('createCard.createButton')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}