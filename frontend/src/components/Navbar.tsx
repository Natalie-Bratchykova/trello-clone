import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { Dashboard, AccountCircle, Login, Logout } from '@mui/icons-material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
 import { useUserData } from '../hooks/useUserData.ts';
interface NavbarProps {
  isAuthenticated: boolean;
  user?: {
    name: string;
    email: string;
  };
  onLogout: () => void;
  onLogin: () => void;
}

export default function Navbar({ isAuthenticated, user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);


  // TODO START: refactor usage of user data to avoid code duplication and extra queries
  const {data} = useUserData(user?.id || '');

  const profileImageUrl = data?.user?.profileImage
      ? `http://localhost:3000${data?.user?.profileImage}`
      : undefined;
  // TODO END
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
    <AppBar position="static" sx={{ mb: 4 }}>
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
            Проекти
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
                <AccountCircle sx={{ mr: 1 }} /> Профіль
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  onLogout();
                  navigate('/login');
                }}
              >
                <Logout sx={{ mr: 1 }} /> Вийти
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button
            color="inherit"
            startIcon={<Login />}
            onClick={handleLoginClick}
          >
            Увійти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

