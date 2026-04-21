import { useAuth } from "../hook/useAuth";
import React, { useEffect } from "react";
import { Spin } from "antd";

const RequireAuth = ({ children, roles }: { children: React.JSX.Element, roles?: string[] }) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth]);

  if (auth.isLoading) {
    return <Spin fullscreen />;
  }

  if (auth.error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Authentication Error</h2>
        <p>{auth.error.message}</p>
        <button onClick={() => auth.signinRedirect()}>Try Again</button>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Spin fullscreen tip="Redirecting to login..." />;
  }

  if (roles && !roles.some(r => auth.roles.includes(r))) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

export { RequireAuth };
