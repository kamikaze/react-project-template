import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router-dom';
import 'antd/dist/reset.css';
import './App.css';

// ============================================================================
// Components
// ============================================================================

import { PageLayout } from './components/PageLayout';

// ============================================================================
// HOCs
// ============================================================================

import { AuthProvider } from './hoc/AuthProvider';
import { RequireAuth } from './hoc/RequireAuth';

// ============================================================================
// Pages
// ============================================================================

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

// Team Pages
import { TeamListPage } from './pages/TeamListPage';
import { TeamViewPage } from './pages/TeamViewPage';
import { TeamEditPage } from './pages/TeamEditPage';
import { TeamCreatePage } from './pages/TeamCreatePage';

// User Pages
import { UserListPage } from './pages/UserListPage';
import { UserViewPage } from './pages/UserViewPage';
import { UserEditPage } from './pages/UserEditPage';
import { UserCreatePage } from './pages/UserCreatePage';
import {UserProfilePage} from "./pages/UserProfilePage.tsx";

// ============================================================================
// Route Definitions
// ============================================================================

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  USER_PROFILE: '/users/me',
  ADMIN: {
    TEAMS: '/admin/teams',
    TEAM_VIEW: '/admin/teams/:id',
    TEAM_EDIT: '/admin/teams/:id/edit',
    TEAM_CREATE: '/admin/teams/new',
    USERS: '/admin/users',
    USER_VIEW: '/admin/users/:id',
    USER_EDIT: '/admin/users/:id/edit',
    USER_CREATE: '/admin/users/new',
  },
} as const;

// ============================================================================
// Route Components
// ============================================================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireAuth>{children}</RequireAuth>
);

// OIDC redirect callback route component. The react-oidc-context provider
// processes the callback automatically; we just need a route to host it.
const OidcCallback: React.FC = () => {
  return <div style={{ padding: 24 }}>Signing you in…</div>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={ROUTES.HOME} element={<PageLayout />}>
      {/* Home Route */}
      <Route
        index
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="admin">
        {/* Team Routes */}
        <Route
          path="teams"
          element={
            <ProtectedRoute>
              <TeamListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teams/new"
          element={
            <ProtectedRoute>
              <TeamCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teams/:id"
          element={
            <ProtectedRoute>
              <TeamViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teams/:id/edit"
          element={
            <ProtectedRoute>
              <TeamEditPage />
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute>
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <ProtectedRoute>
              <UserCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute>
              <UserViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute>
              <UserEditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      {/* OIDC redirect callback path must match redirect_uri */}
      <Route path="/oidc/callback" element={<OidcCallback />} />
      <Route
        path={ROUTES.USER_PROFILE}
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Route>
  )
);

// ============================================================================
// App Component
// ============================================================================

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
