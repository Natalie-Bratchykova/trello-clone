import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $name: String!) {
    createUser(data: { email: $email, password: $password, name: $name }) {
      id
      email
      name
    }
  }
`;

interface RegisterData {
  createUser: {
    id: string;
    email: string;
    name: string;
  };
}

interface RegisterPageProps {
  onLogin: (user: { id: string; name: string; email: string }) => void;
}

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [register, { loading, error }] = useMutation<RegisterData>(REGISTER_MUTATION);

  const handleRegisterSuccess = (data: RegisterData) => {
    if (data.createUser) {
      // Зберігаємо інформацію в localStorage
      localStorage.setItem('user', JSON.stringify(data.createUser));
      localStorage.setItem('isAuthenticated', 'true');

      // Викликаємо callback для оновлення стану
      onLogin(data.createUser);

      // Перенаправляємо на сторінку проектів
      navigate('/projects');
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name) {
      newErrors.name = 'Ім\'я обов\'язкове';
    } else if (name.length < 2) {
      newErrors.name = 'Ім\'я має бути мінімум 2 символи';
    }

    if (!email) {
      newErrors.email = 'Email обов\'язковий';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Невірний формат email';
    }

    if (!password) {
      newErrors.password = 'Пароль обов\'язковий';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль має бути мінімум 6 символів';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Підтвердіть пароль';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Паролі не співпадають';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await register({
        variables: {
          name,
          email,
          password,
        },
      });

      if (result.data) {
        handleRegisterSuccess(result.data);
      }
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Реєстрація
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Створіть новий акаунт TaskBoard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message.includes('email')
                ? 'Користувач з таким email вже існує'
                : 'Помилка реєстрації. Спробуйте ще раз'}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Ім'я"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
              autoComplete="name"
              autoFocus
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Підтвердження пароля"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Реєстрація...' : 'Зареєструватися'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Вже є акаунт?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{ fontWeight: 600 }}
                >
                  Увійти
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

