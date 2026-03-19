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
import TaskPage from './pages/TaskPage';
import ProfilePage from './pages/ProfilePage';
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string, roleId: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

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
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
                    <Navbar
                        isAuthenticated={isAuthenticated}
                        user={user || undefined}
                        onLogout={handleLogout}
                        onLogin={() => {}}
                    />

                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />
                            }
                        />

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

                        <Route
                            path="/projects"
                            element={
                                <ProjectsPage
                                    isAuthenticated={isAuthenticated}
                                    userId={user?.id}
                                    onLogin={() => {}}
                                />
                            }
                        />

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

                        <Route
                            path="/task/:id"
                            element={
                                isAuthenticated ? (
                                    <TaskPage />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

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
    </DndProvider>
  );
}

export default App;

