import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { Dashboard, AccountCircle, Login, Logout } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserData } from '../hooks/useUserData.ts';
import LanguageSwitcher from './LanguageSwitcher';
import { getUserProfileUrl } from "../helpers/utils/userHelper.ts";
import { useUserContext } from '../context/UserContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, updateUser } = useUserContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data } = useUserData(user?.id, !user?.id || !!user?.profileImage);

  useEffect(() => {
    if (data?.user?.profileImage && data.user.profileImage !== user?.profileImage) {
      updateUser({ profileImage: data.user.profileImage });
    }
  }, [data, user, updateUser]);

  const profileImageUrl = getUserProfileUrl(user?.profileImage);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Лого */}
        <Dashboard sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
          }}
        >
          TaskBoard
        </Typography>

        {/* Проекти - тільки для авторизованих */}
        {isAuthenticated && (
          <Button
            color="inherit"
            component={Link}
            to="/projects"
            startIcon={<Dashboard />}
          >
            {t('navbar.projects')}
          </Button>
        )}

        {/* Профіль користувача або Увійти */}
        {isAuthenticated && user ? (
          <Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar src={profileImageUrl} sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {!profileImageUrl &&( user.name?.charAt(0).toUpperCase() || 'U')}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user.name}</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleClose} component={Link} to="/profile">
                <AccountCircle sx={{ mr: 1 }} /> {t('navbar.profile')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  logout();
                  navigate('/login');
                }}
              >
                <Logout sx={{ mr: 1 }} /> {t('navbar.logout')}
              </MenuItem>
            </Menu>
            <LanguageSwitcher />
          </Box>
        ) : (
          <>
            <Button
              color="inherit"
              startIcon={<Login />}
              onClick={handleLoginClick}
            >
              {t('navbar.login')}
            </Button>
            <LanguageSwitcher />
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
