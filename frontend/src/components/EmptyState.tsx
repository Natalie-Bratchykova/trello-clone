import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';
import { Login, Dashboard } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function EmptyState() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          backgroundColor: 'background.default',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Dashboard
          sx={{
            fontSize: 80,
            color: 'text.secondary',
            mb: 2,
          }}
        />

        <Typography variant="h4" gutterBottom>
          {t('emptyState.welcome')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('emptyState.description')}
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<Login />}
          onClick={handleLoginClick}
          sx={{ minWidth: 200 }}
        >
          {t('emptyState.loginButton')}
        </Button>

        <Box sx={{ mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            {t('emptyState.noAccount')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
