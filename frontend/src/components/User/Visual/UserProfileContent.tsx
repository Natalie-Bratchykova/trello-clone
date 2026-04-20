import {memo} from "react";
import {
    Avatar,
    Box,
    Button,
    Container, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton, InputLabel, List, ListItem, ListItemAvatar, ListItemText,
    Paper, Select, Snackbar,
    TextField,
    Typography
} from "@mui/material";
import {PhotoCamera} from "@mui/icons-material";
import {t} from "i18next";

function DashboardIcon(props: { sx: { verticalAlign: string; mr: number } }) {
    return null;
}

function userProfileContent(){

    return(
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
            <Grid container spacing={3}>
                {/* Ліва колонка - Основна інформація */}
                <Grid item size={{xs:12, md:4}}>
                    <Paper sx={{p: 3, textAlign: 'center'}}>
                        {/* Аватар */}
                        <Box sx={{position: 'relative', display: 'inline-block', mb: 2}}>
                            <Avatar
                                src={profileImageUrl}
                                sx={{
                                    width: 150,
                                    height: 150,
                                    fontSize: '3rem',
                                    bgcolor: 'primary.main',
                                }}
                            >
                                {!profileImageUrl && (user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase())}
                            </Avatar>

                            {/* Кнопка завантаження фото */}
                            <IconButton
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    bgcolor: 'background.paper',
                                    boxShadow: 2,
                                    '&:hover': {bgcolor: 'grey.200'},
                                }}
                                component="label"
                            >
                                <PhotoCamera/>
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </IconButton>
                        </Box>

                        {/* Ім'я та email */}
                        <Typography variant="h5" gutterBottom>
                            {user?.name || t('common.noName')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {user?.email}
                        </Typography>

                        <Divider sx={{my: 2}}/>

                        {/* Статистика */}
                        <Box sx={{display: 'flex', justifyContent: 'space-around', mb: 2}}>
                            <Box>
                                <Typography variant="h6">{boards.length}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('profile.projects')}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Кнопка зміни паролю */}
                        <Button
                            variant="outlined"
                            startIcon={<Lock/>}
                            fullWidth
                            onClick={() => setPasswordDialogOpen(true)}
                            sx={{mt: 2}}
                        >
                            {t('profile.changePassword')}
                        </Button>
                    </Paper>
                </Grid>

                {/* Права колонка - Деталі профілю та проекти */}
                <Grid item size={{xs:12, md:8}}>
                    {/* Інформація профілю */}
                    <Paper sx={{p: 3, mb: 3}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
                            <Typography variant="h6">
                                {t('profile.title')}
                            </Typography>
                            {!isEditing ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Edit/>}
                                    onClick={handleEditToggle}
                                    disabled={updateLoading}
                                >
                                    {t('common.edit')}
                                </Button>
                            ) : (
                                <Button
                                    variant="outlined"
                                    startIcon={<Cancel/>}
                                    onClick={handleEditToggle}
                                    disabled={updateLoading}
                                >
                                    {t('common.cancel')}
                                </Button>
                            )}
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('auth.nameLabel')}
                                    value={isEditing ? editedName : user?.name || ''}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    disabled={!isEditing}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('auth.emailLabel')}
                                    value={isEditing ? editedEmail : user?.email || ''}
                                    onChange={(e) => setEditedEmail(e.target.value)}
                                    disabled={!isEditing}
                                    type="email"
                                />
                            </Grid>
                            <Grid item  xs={12}>
                                <FormControl sx={{ minWidth: 120 }}>
                                    <InputLabel>{t('profile.role')}</InputLabel>
                                    <Select label={t('profile.role')} value={user.roleId|| roleId} onChange={(e) => SetRoleId(e.target.value)} disabled={!isEditing} variant={userRoleId}>
                                        {roles?.roles?.map(role => {
                                            return (<MenuItem key={role.id} value={role.id} selected={Number(role.id) === Number(userRoleId)}>{role.name}</MenuItem>)
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.registrationDate')}
                                    value={user?.createdAt ? formatDate(i18n.language, user.createdAt, false) : ''}
                                    disabled
                                    variant="filled"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.lastUpdate')}
                                    value={user?.updatedAt ? formatDate(i18n.language, user.updatedAt, false) : ''}
                                    disabled
                                    variant="filled"
                                />
                            </Grid>
                        </Grid>

                        {isEditing && (
                            <Box sx={{mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2}}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save/>}
                                    onClick={handleSave}
                                    disabled={updateLoading}
                                >
                                    {t('profile.saveChanges')}
                                </Button>
                            </Box>
                        )}
                    </Paper>

                    {/* Проекти (Дошки) */}
                    <Paper sx={{p: 3}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                            <Typography variant="h6">
                                <DashboardIcon sx={{verticalAlign: 'middle', mr: 1}}/>
                                {t('profile.myProjects')} ({boards.length})
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate('/projects')}
                            >
                                {t('common.viewAll')}
                            </Button>
                        </Box>

                        {boards.length === 0 ? (
                            <Box sx={{textAlign: 'center', py: 4}}>
                                <Typography color="text.secondary">
                                    {t('profile.noProjects')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    sx={{mt: 2}}
                                    onClick={() => navigate('/projects')}
                                >
                                    {t('profile.createFirst')}
                                </Button>
                            </Box>
                        ) : (
                            <List>
                                {boards.slice(0, 5).map((board: any) => (
                                    <ListItem
                                        key={board.id}
                                        button
                                        onClick={() => navigate(`/board/${board.id}`)}
                                        sx={{
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1,
                                            '&:hover': {
                                                bgcolor: 'action.hover',
                                                cursor:'pointer',
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: board.color || 'primary.main',
                                                    width: 40,
                                                    height: 40,
                                                }}
                                            >
                                                <Folder/>
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={board.title}
                                            secondary={`${t('board.created')}: ${formatDate(i18n.language, board.createdAt, false)}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Діалог зміни паролю */}
            <Dialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('profile.passwordDialog')}</DialogTitle>
                <DialogContent>
                    <Box sx={{pt: 2}}>
                        <TextField
                            fullWidth
                            label={t('profile.currentPassword')}
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            sx={{mb: 2}}
                        />
                        <TextField
                            fullWidth
                            label={t('profile.newPassword')}
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            sx={{mb: 2}}
                            helperText={t('profile.passwordHelp')}
                        />
                        <TextField
                            fullWidth
                            label={t('profile.confirmNewPassword')}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePasswordChange}
                        disabled={updateLoading}
                    >
                        {t('profile.changePassword')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar для повідомлень */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({...snackbar, open: false})}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setSnackbar({...snackbar, open: false})}
                    severity={snackbar.severity}
                    sx={{width: '100%'}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    )
}


export default memo(userProfileContent);