import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar, Select, FormControl, InputLabel, MenuItem,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Lock,
  Dashboard as DashboardIcon,
  Folder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserProfileImage } from '../hooks/useUserProfileImage';
// GraphQL запити
import {GET_USER_PROFILE, UPDATE_USER, GET_ALL_ROLES} from "../helpers/gql/userGQL.ts";


interface ProfilePageProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function ProfilePage({userId, userName, userEmail, userRoleId}: ProfilePageProps) {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userName);
  const [editedEmail, setEditedEmail] = useState(userEmail);

  const [roleId, SetRoleId] = useState(userRoleId);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {handleImageUpload} = useUserProfileImage(userId, () => refetch());

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({open: false, message: '', severity: 'success'});


  const {data, loading, error, refetch} = useQuery(GET_USER_PROFILE, {
    variables: {userId},
  }) as any;

  const {data:roles} = useQuery(GET_ALL_ROLES) as any;
  const [updateUser, {loading: updateLoading}] = useMutation(UPDATE_USER) as any;

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedName(data?.user?.name || userName);
      setEditedEmail(data?.user?.email || userEmail);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      await updateUser({
        variables: {
          id: userId,
          data: {
            name: editedName,
            email: editedEmail,
            roleId: parseFloat((roleId).toString()),
          },
        },
      });


      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.name = editedName;
        user.email = editedEmail;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSnackbar({
        open: true,
        message: 'Профіль успішно оновлено!',
        severity: 'success',
      });
      setIsEditing(false);
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Помилка при оновленні профілю',
        severity: 'error',
      });
      console.error('Error updating profile:', err);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Заповніть всі поля',
        severity: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Паролі не співпадають',
        severity: 'error',
      });
      return;
    }

    if (newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'Пароль повинен містити мінімум 6 символів',
        severity: 'error',
      });
      return;
    }

    try {
      await updateUser({
        variables: {
          id: userId,
          data: {
            password: newPassword,
          },
        },
      });

      setSnackbar({
        open: true,
        message: 'Пароль успішно змінено!',
        severity: 'success',
      });
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Помилка при зміні паролю',
        severity: 'error',
      });
      console.error('Error changing password:', err);
    }
  };

  if (loading) {
    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
          <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
            <CircularProgress/>
          </Box>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
          <Alert severity="error">Помилка завантаження профілю: {error.message}</Alert>
        </Container>
    );
  }

  const user = data?.user;
  const boards = data?.userBoards || [];
  // TODO START: refactor usage of user data to avoid code duplication and extra queries
  const profileImageUrl = user?.profileImage
      ? `http://localhost:3000${user.profileImage}`
      : undefined;
// TODO END
  return (
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
                {user?.name || 'Без імені'}
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
                    Проектів
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
                Змінити пароль
              </Button>
            </Paper>
          </Grid>

          {/* Права колонка - Деталі профілю та проекти */}
          <Grid item size={{xs:12, md:8}}>
            {/* Інформація профілю */}
            <Paper sx={{p: 3, mb: 3}}>
              <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
                <Typography variant="h6">
                  Інформація профілю
                </Typography>
                {!isEditing ? (
                    <Button
                        variant="contained"
                        startIcon={<Edit/>}
                        onClick={handleEditToggle}
                        disabled={updateLoading}
                    >
                      Редагувати
                    </Button>
                ) : (
                    <Button
                        variant="outlined"
                        startIcon={<Cancel/>}
                        onClick={handleEditToggle}
                        disabled={updateLoading}
                    >
                      Скасувати
                    </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                      fullWidth
                      label="Ім'я"
                      value={isEditing ? editedName : user?.name || ''}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                      fullWidth
                      label="Email"
                      value={isEditing ? editedEmail : user?.email || ''}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      disabled={!isEditing}
                      type="email"
                  />
                </Grid>
                <Grid item  xs={12}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Role</InputLabel>
                    <Select label={"Роль"} value={user.roleId|| roleId} onChange={(e) => SetRoleId(e.target.value)} disabled={!isEditing} variant={userRoleId}>
                      {roles?.roles?.map(role => {
                        return (<MenuItem key={role.id} value={role.id} selected={Number(role.id) === Number(userRoleId)}>{role.name}</MenuItem>)
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                      fullWidth
                      label="Дата реєстрації"
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA') : ''}
                      disabled
                      variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                      fullWidth
                      label="Останнє оновлення"
                      value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('uk-UA') : ''}
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
                      Зберегти зміни
                    </Button>
                  </Box>
              )}
            </Paper>

            {/* Проекти (Дошки) */}
            <Paper sx={{p: 3}}>
              <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                <Typography variant="h6">
                  <DashboardIcon sx={{verticalAlign: 'middle', mr: 1}}/>
                  Мої проекти ({boards.length})
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/projects')}
                >
                  Переглянути всі
                </Button>
              </Box>

              {boards.length === 0 ? (
                  <Box sx={{textAlign: 'center', py: 4}}>
                    <Typography color="text.secondary">
                      У вас ще немає проектів
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{mt: 2}}
                        onClick={() => navigate('/projects')}
                    >
                      Створити перший проект
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
                              secondary={`Створено: ${new Date(board.createdAt).toLocaleDateString('uk-UA')}`}
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
          <DialogTitle>Змінити пароль</DialogTitle>
          <DialogContent>
            <Box sx={{pt: 2}}>
              <TextField
                  fullWidth
                  label="Поточний пароль"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{mb: 2}}
              />
              <TextField
                  fullWidth
                  label="Новий пароль"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{mb: 2}}
                  helperText="Мінімум 6 символів"
              />
              <TextField
                  fullWidth
                  label="Підтвердження нового паролю"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              Скасувати
            </Button>
            <Button
                variant="contained"
                onClick={handlePasswordChange}
                disabled={updateLoading}
            >
              Змінити пароль
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
  );
}

