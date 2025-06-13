import React from 'react';
import 'antd/dist/reset.css';
import './App.css';
import {createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider} from 'react-router-dom';

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
// import {authLoader} from "./auth";

const router = createBrowserRouter(createRoutesFromElements(
  <Route path={'/'} element={<PageLayout />}>
    <Route index element={<RequireAuth><HomePage /></RequireAuth>} />

    <Route path={'admin'}>
      <Route path={'teams'} element={<RequireAuth><TeamListPage /></RequireAuth>} />
      <Route path={'teams/:id'} element={<RequireAuth><TeamViewPage /></RequireAuth>} />
      <Route path={'teams/:id/edit'} element={<RequireAuth><TeamEditPage /></RequireAuth>} />
      <Route path={'teams/new'} element={<RequireAuth><TeamCreatePage /></RequireAuth>} />
      <Route
        path={'users'}
        element={<RequireAuth><UserListPage /></RequireAuth>}
        // loader={authLoader(userListLoader)}
      />
      <Route path={'users/:id'} element={<RequireAuth><UserViewPage /></RequireAuth>} />
      <Route path={'users/:id/edit'} element={<RequireAuth><UserEditPage /></RequireAuth>} />
      <Route path={'users/new'} element={<RequireAuth><UserCreatePage /></RequireAuth>} />
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
