import React from 'react';
import 'antd/dist/reset.css';
import './App.css';
import {createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider} from 'react-router-dom';

import {HomePage} from './pages/HomePage';
import {TeamListPage} from './pages/TeamListPage';
import {TeamViewPage} from './pages/TeamViewPage';
import {TeamEditPage} from './pages/TeamEditPage';
import {TeamCreatePage} from './pages/TeamCreatePage';
import {UserListPage} from './pages/UserListPage';
import {UserViewPage} from './pages/UserViewPage';
import {UserEditPage} from './pages/UserEditPage';
import {UserCreatePage} from './pages/UserCreatePage';
import {LoginPage} from './pages/LoginPage';
import {PageLayout} from "./components/PageLayout";
import {RequireAuth} from "./hoc/RequireAuth";
import {AuthProvider} from "./hoc/AuthProvider";
import {authLoader} from "./auth";

const router = createBrowserRouter(createRoutesFromElements(
  <Route path={'/'} element={<RequireAuth><PageLayout /></RequireAuth>}>
    <Route index element={<HomePage />} />
    <Route path={'admin'} element={<RequireAuth roles={['admin']}><Outlet /></RequireAuth>}>
      <Route path={'teams'} element={<TeamListPage />} />
      <Route path={'teams/:id'} element={<TeamViewPage />} />
      <Route path={'teams/:id/edit'} element={<TeamEditPage />} />
      <Route path={'teams/new'} element={<TeamCreatePage />} />
      <Route path={'users'} element={<UserListPage />} />
      <Route path={'users/:id'} element={<UserViewPage />} />
      <Route path={'users/:id/edit'} element={<UserEditPage />} />
      <Route path={'users/new'} element={<UserCreatePage />} />
    </Route>
    <Route path={'login'} element={<LoginPage />} />
    <Route path={'*'} element={<Navigate to={'/'} replace />} />
  </Route>
))

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
