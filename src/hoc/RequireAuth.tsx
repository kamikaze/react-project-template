import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from "../hook/useAuth";
import React from "react";

const RequireAuth = ({ children }: { children: React.JSX.Element }) => {
  const location = useLocation();
  const {user} = useAuth();

  if (!user) {
    return <Navigate to={'/login'} state={{from: location}} />
  }

  return children;
}

export {RequireAuth};
