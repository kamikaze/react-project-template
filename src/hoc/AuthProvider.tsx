import { createContext, ReactNode, useEffect, useState } from 'react';
import config from '../config';

interface AuthContextType {
  user: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signin: (user: string, callback: VoidFunction) => void;
  signout: (callback: VoidFunction) => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user on refresh
  useEffect(() => {
    fetch(config.API_BASE_URL + '/users/me', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setUser(data?.email ?? null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  let signin = (newUser: string, callback: VoidFunction) => {
    setUser(newUser);
    callback();
  };

  let signout = (callback: VoidFunction) => {
    fetch('/users/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setUser(null);
      callback();
    });
  };

  let value = { user, loading, isAuthenticated: !!user, signin, signout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
