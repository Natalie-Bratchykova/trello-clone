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
import ProjectEditPage from "./pages/ProjectEditPage.tsx";
import { useUserContext } from './context/UserContext';

function App() {
  const { isAuthenticated, loading } = useUserContext();

  if (loading) {
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
                    <Navbar />

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
                                    <LoginPage />
                                )
                            }
                        />

                        <Route
                            path="/register"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/projects" replace />
                                ) : (
                                    <RegisterPage />
                                )
                            }
                        />

                        <Route
                            path="/projects"
                            element={
                                <ProjectsPage />
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                isAuthenticated ? (
                                    <ProfilePage />
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
                                    <ProjectEditPage />
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
