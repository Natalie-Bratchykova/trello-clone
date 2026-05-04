import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import { useUserContext } from './context/UserContext';
import { ROUTES } from './helpers/config';

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
                        {ROUTES.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={route.element(isAuthenticated)}
                            />
                        ))}
                    </Routes>
                </Box>
            </Router>
        </ThemeProvider>
    </DndProvider>
  );
}

export default App;
