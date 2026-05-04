import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import ProjectsPage from '../pages/ProjectsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import BoardPage from '../pages/BoardPage';
import TaskPage from '../pages/TaskPage';
import ProfilePage from '../pages/ProfilePage';
import ProjectEditPage from '../pages/ProjectEditPage';

export const GRAPH_GQL_URL = 'http://localhost:3000/graphql';
export const API_URL = 'http://localhost:3000';

export interface RouteConfig {
  path: string;
  element: (isAuthenticated: boolean) => ReactElement;
  requiresAuth?: boolean;
  redirectIfAuth?: boolean;
}

export const ROUTES: RouteConfig[] = [
  {
    path: '/',
    element: (isAuthenticated: boolean) => (
      <Navigate to={isAuthenticated ? '/projects' : '/login'} replace />
    ),
  },
  {
    path: '/login',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <Navigate to="/projects" replace /> : <LoginPage />,
    redirectIfAuth: true,
  },
  {
    path: '/register',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <Navigate to="/projects" replace /> : <RegisterPage />,
    redirectIfAuth: true,
  },
  {
    path: '/projects',
    element: () => <ProjectsPage />,
  },
  {
    path: '/profile',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />,
    requiresAuth: true,
  },
  {
    path: '/board/:id',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <BoardPage /> : <Navigate to="/login" replace />,
    requiresAuth: true,
  },
  {
    path: '/task/:id',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <TaskPage /> : <Navigate to="/login" replace />,
    requiresAuth: true,
  },
  {
    path: '/board/:id/edit',
    element: (isAuthenticated: boolean) =>
      isAuthenticated ? <ProjectEditPage /> : <Navigate to="/login" replace />,
    requiresAuth: true,
  },
  {
    path: '*',
    element: (isAuthenticated: boolean) => (
      <Navigate to={isAuthenticated ? '/projects' : '/login'} replace />
    ),
  },
];
