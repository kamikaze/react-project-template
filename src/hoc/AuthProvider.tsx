import React, {createContext, type PropsWithChildren, type ReactNode, useEffect, useState} from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, InteractionRequiredAuthError } from '@azure/msal-browser';
import config from '../config';
import { loginRequest, authenticatedUserProfileRequest } from '../auth';

// Augment Window type to include our private _originalFetch reference used for patching
declare global {
  interface Window {
    _originalFetch?: typeof fetch;
  }
}

type AuthMode = 'session' | 'oidc' | null;

interface AuthContextType {
  user: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMode: AuthMode;
  signin: (user: string, callback: VoidFunction) => void;  // Legacy session signin
  signinOIDC: (callback?: VoidFunction) => void;  // OIDC signin
  signout: (callback?: VoidFunction) => void;
  getAccessToken: () => Promise<string | null>;  // For manual use if needed
}

interface AuthProviderProps extends PropsWithChildren {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { instance, accounts, inProgress } = useMsal();

  // Step 1: Check for existing session (preserve legacy)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/users/me`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.email);
          setAuthMode('session');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('No active session, falling back to OIDC');
      }

      // Step 2: No session, init OIDC
      try {
        await fetch(`${config.API_BASE_URL}/config`)
          .then(res => res.json())
          .then((oidcConfig: any) => {
            instance.getConfiguration().auth.clientId = oidcConfig.oidc_client_id;
            instance.getConfiguration().auth.authority = oidcConfig.oidc_authority_url;
            return instance.initialize();
          });

        setAuthMode('oidc');

        if (accounts.length > 0) {
          // Existing OIDC session
          await fetchUserProfile();
        } else if (inProgress === InteractionStatus.None) {
          // No session, but don't auto-login here; let LoginPage handle
          setLoading(false);
        }
      } catch (err) {
        console.error('OIDC init failed:', err);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await instance.ssoSilent(authenticatedUserProfileRequest);
      const token = response.accessToken;
      setAccessToken(token);

      // Patch fetch for OIDC mode (centralized: adds bearer to API calls)
      if (!window._originalFetch) {
        window._originalFetch = window.fetch;
      }

      const hasAuthHeader = (headersInit?: HeadersInit): boolean => {
        if (!headersInit) return false;
        if (headersInit instanceof Headers) {
          return headersInit.has('Authorization') || headersInit.has('authorization');
        }
        if (Array.isArray(headersInit)) {
          return headersInit.some(([k]) => k.toLowerCase() === 'authorization');
        }
        // Record<string, string>
        return Object.keys(headersInit).some(k => k.toLowerCase() === 'authorization');
      };

      window.fetch = async (...args: Parameters<typeof fetch>) => {
        const [url, options = {} as RequestInit] = args;
        if (typeof url === 'string' && url.startsWith(config.API_BASE_URL) && !hasAuthHeader(options.headers)) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          const newOptions: RequestInit = { ...options, headers, credentials: 'include' };
          const originalFetch = window._originalFetch ?? window.fetch;
          return originalFetch(url, newOptions);
        }
        const originalFetch = window._originalFetch ?? window.fetch;
        return originalFetch(...args as [RequestInfo, RequestInit?]);
      };

      // Fetch /users/me with token (now patched)
      const res = await fetch(`${config.API_BASE_URL}/users/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.email);
      } else {
        setUser(accounts[0]?.username || null);
      }
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        signinOIDC();
      } else {
        console.error('Auth error:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signin = async (newUser: string, callback: VoidFunction) => {
    // Legacy session signin
    try {
      const body = new URLSearchParams({ username: newUser, password: 'dummy' });  // Password from form, but dummy here
      const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (response.ok) {
        // Refetch /users/me to set user
        const meRes = await fetch(`${config.API_BASE_URL}/users/me`, { credentials: 'include' });
        const data = await meRes.json();
        setUser(data.email);
        setAuthMode('session');
        callback();
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      console.error('Session signin failed:', err);
      callback();  // Still call to allow UI update
    }
  };

  const signinOIDC = (callback?: VoidFunction) => {
    if (inProgress === InteractionStatus.None && authMode === 'oidc') {
      instance.loginRedirect({ ...loginRequest, ...(callback && { onSuccess: callback }) }).catch(console.error);
    }
  };

  const signout = async (callback?: VoidFunction) => {
    if (authMode === 'session') {
      await fetch(`${config.API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } else if (authMode === 'oidc') {
      instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin + '/login' }).catch(console.error);
      // Clear patch
      if (window._originalFetch) {
        window.fetch = window._originalFetch;
        window._originalFetch = undefined;
      }
    }
    setUser(null);
    setAccessToken(null);
    setAuthMode(null);
    if (callback) callback();
  };

  const getAccessToken = async () => {
    if (authMode !== 'oidc' || !instance) return null;
    try {
      const response = await instance.acquireTokenSilent(authenticatedUserProfileRequest);
      setAccessToken(response.accessToken);  // Update stored token
      return response.accessToken;
    } catch {
      return null;
    }
  };

  const value = {
    user,
    loading: loading || inProgress !== InteractionStatus.None,
    isAuthenticated: !!user,
    authMode,
    signin,
    signinOIDC,
    signout,
    getAccessToken,
  };

  // Auto-fetch OIDC profile if accounts appear after redirect
  useEffect(() => {
    if (authMode === 'oidc' && accounts.length > 0 && !user) {
      fetchUserProfile();
    }
  }, [accounts.length, authMode]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
