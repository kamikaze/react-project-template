import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from "../hook/useAuth";
import React from "react";

interface Props {
  children: React.JSX.Element
}

const RequireAuth = ({children}: Props) => {
  const location = useLocation();
  const {user} = useAuth();

  if (!user) {
    return <Navigate to={'/login'} state={{from: location}}/>
  }

  return children;
}

export {RequireAuth};
