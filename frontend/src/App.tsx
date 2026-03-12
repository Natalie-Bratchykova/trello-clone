import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string, roleId: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Перевірка сесії при завантаженні додатку
  useEffect(() => {
    const checkSession = () => {
      try {
        const savedAuth = localStorage.getItem('isAuthenticated');
        const savedUser = localStorage.getItem('user');

        if (savedAuth === 'true' && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setIsAuthenticated(true);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // Якщо помилка - очищаємо localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData: { id: string; name: string; email: string }) => {
    setIsAuthenticated(true);
    setUser(userData);
    // Зберігаємо в localStorage (вже зберігається в LoginPage/RegisterPage, але для консистентності)
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Очищаємо localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // Показуємо завантаження поки перевіряємо сесію
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.default',
          }}
        >
          {/* Можна додати Spinner тут */}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          <Navbar
            isAuthenticated={isAuthenticated}
            user={user || undefined}
            onLogout={handleLogout}
            onLogin={() => {}} // Тепер не використовується, логін через форму
          />

          <Routes>
            {/* Головна сторінка - редирект */}
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />
              }
            />

            {/* Сторінка логіну */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/projects" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />

            {/* Сторінка реєстрації */}
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/projects" replace />
                ) : (
                  <RegisterPage onLogin={handleLogin} />
                )
              }
            />

            {/* Сторінка проектів */}
            <Route
              path="/projects"
              element={
                <ProjectsPage
                  isAuthenticated={isAuthenticated}
                  userId={user?.id}
                  onLogin={() => {}} // Не використовується, редирект на /login
                />
              }
            />

            {/* Профіль */}
            <Route
              path="/profile"
              element={
                isAuthenticated && user ? (
                  <ProfilePage
                    userId={user.id}
                    userName={user.name}
                    userEmail={user.email}
                    userRole={user.roleId}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Дошка проекту */}
            <Route
              path="/board/:id"
              element={
                isAuthenticated ? (
                  <BoardPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Редагування проекту */}
            <Route
              path="/board/:id/edit"
              element={
                isAuthenticated ? (
                  <Box sx={{ p: 3 }}>
                    <h1>Редагування проекту (в розробці)</h1>
                  </Box>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />
              }
            />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

