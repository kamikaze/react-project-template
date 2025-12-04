import React, { createContext, type PropsWithChildren, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {AuthProvider as OidcProvider, type AuthProviderProps, useAuth as useOidc} from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import config from '../config';

// ============================================================================
// Type Definitions
// ============================================================================

declare global {
  interface Window {
    _originalFetch?: typeof fetch;
  }
}

type AuthMode = 'session' | 'oidc' | null;

export interface AuthContextType {
  user: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMode: AuthMode;
  signin: (user: string, callback: VoidFunction) => Promise<void>;
  signinOIDC: (callback?: VoidFunction) => Promise<void>;
  signout: (callback?: VoidFunction) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

interface OidcBridgeProps extends PropsWithChildren {
  sessionUser: string | null;
  setSessionUser: (user: string | null) => void;
  setAuthMode: (mode: AuthMode) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  pendingOidcSignin: boolean;
  setPendingOidcSignin: (pending: boolean) => void;
  children: React.ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';

// ============================================================================
// Context
// ============================================================================

export const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Utility Functions
// ============================================================================

const fetchOidcConfig = async (): Promise<AuthProviderProps | null> => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/config`);

    if (!response.ok) {
      console.warn(`/config returned non-OK status: ${response.status}`);

      return null;
    }

    const data = await response.json();

    return {
      authority: data.oidc_authority_url,
      client_id: data.oidc_client_id,
      redirect_uri: `${window.location.origin}/oidc/callback`,
      // Keep minimal scope for SPA; include required API scopes; avoid offline_access in browser
      scope: data.oidc_scope,
      resource: data.oidc_audience,
      // Prefer sessionStorage to limit token persistence in browser
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      onSigninCallback: () => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      },
      automaticSilentRenew: true,
      monitorSession: true,
    };
  } catch (error) {
    console.error('Failed to load OIDC config:', error);

    return null;
  }
};

const checkExistingSession = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/users/me`, {
      credentials: 'include',
    });
    if (!response.ok) {
      console.warn(`/users/me returned non-OK status: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.email;
  } catch (error) {
    console.log('No active session, falling back to OIDC');
    return null;
  }
};

const hasAuthorizationHeader = (headersInit?: HeadersInit): boolean => {
  if (!headersInit) return false;

  if (headersInit instanceof Headers) {
    return headersInit.has('Authorization') || headersInit.has('authorization');
  }

  if (Array.isArray(headersInit)) {
    return headersInit.some(([key]) => key.toLowerCase() === 'authorization');
  }

  return Object.keys(headersInit).some(
    (key) => key.toLowerCase() === 'authorization'
  );
};

const handlePostLoginRedirect = (): void => {
  try {
    const target = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (target) {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
    }
  } catch (error) {
    console.error('Failed to handle post-login redirect:', error);
  }
};

// ============================================================================
// Main Provider Component
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [oidcConfig, setOidcConfig] = useState<AuthProviderProps | null>(null);
  const [pendingOidcSignin, setPendingOidcSignin] = useState(false);

  // ============================================================================
  // Initial Authentication Check
  // ============================================================================

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      // Load OIDC config first
      const config = await fetchOidcConfig();
      if (!cancelled && config) {
        setOidcConfig(config);
      }

      // Check for existing session
      const sessionUser = await checkExistingSession();
      if (!cancelled) {
        if (sessionUser) {
          setUser(sessionUser);
          setAuthMode('session');
        } else {
          setAuthMode('oidc');
        }
        setLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  const signin = useCallback(
    async (newUser: string, callback: VoidFunction): Promise<void> => {
      try {
        const body = new URLSearchParams({
          username: newUser,
          password: 'dummy', // Replace with actual password handling
        });

        const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        if (response.ok) {
          const meResponse = await fetch(`${config.API_BASE_URL}/users/me`, {
            credentials: 'include',
          });
          const data = await meResponse.json();
          setUser(data.email);
          setAuthMode('session');
        } else {
          throw new Error('Login failed');
        }
      } catch (error) {
        console.error('Session signin failed:', error);
        throw error;
      } finally {
        callback();
      }
    },
    []
  );

  const signinOIDC = useCallback(async (): Promise<void> => {
    try {
      // If already in OIDC mode with config, just set pending flag
      if (authMode === 'oidc' && oidcConfig) {
        setPendingOidcSignin(true);
        return;
      }

      // If config is loaded but not in OIDC mode, switch modes
      if (oidcConfig) {
        setAuthMode('oidc');
        setPendingOidcSignin(true);
        return;
      }

      // Fallback: load config if not present
      const config = await fetchOidcConfig();
      if (config) {
        setOidcConfig(config);
        setAuthMode('oidc');
        setPendingOidcSignin(true);
      } else {
        throw new Error('Failed to load OIDC configuration');
      }
    } catch (error) {
      console.error('Failed to initialize OIDC:', error);
      throw error;
    }
  }, [authMode, oidcConfig]);

  const signout = useCallback(
    async (callback?: VoidFunction): Promise<void> => {
      if (authMode === 'session') {
        try {
          await fetch(`${config.API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout request failed:', error);
        }
        setUser(null);
        setAccessToken(null);
        setAuthMode(null);
      }
      callback?.();
    },
    [authMode]
  );

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return accessToken;
  }, [accessToken]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const baseValue = useMemo(
    (): AuthContextType => ({
      user,
      loading,
      isAuthenticated: !!user,
      authMode,
      signin,
      signinOIDC,
      signout,
      getAccessToken,
    }),
    [user, loading, authMode, signin, signout, getAccessToken]
  );

  // ============================================================================
  // Render Logic
  // ============================================================================

  // If not in OIDC mode or config not loaded, use base context
  if (authMode !== 'oidc' || !oidcConfig) {
    return (
      <AuthContext.Provider value={baseValue}>{children}</AuthContext.Provider>
    );
  }

  // OIDC provider configuration
  const oidcProviderConfig = {
    ...oidcConfig,
    redirect_uri: `${window.location.origin}/oidc/callback`,
    post_logout_redirect_uri: window.location.origin,
    automaticSilentRenew: true,
    onSigninCallback: () => {
      // Clean up URL after successful login
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    },
  } as AuthProviderProps;

  return (
    <OidcProvider {...oidcProviderConfig}>
      <OidcBridge
        sessionUser={user}
        setSessionUser={setUser}
        setAuthMode={setAuthMode}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
        pendingOidcSignin={pendingOidcSignin}
        setPendingOidcSignin={setPendingOidcSignin}
      >
        {children}
      </OidcBridge>
    </OidcProvider>
  );
};

// ============================================================================
// OIDC Bridge Component
// ============================================================================

const OidcBridge: React.FC<OidcBridgeProps> = ({
                                                 sessionUser,
                                                 setSessionUser,
                                                 setAuthMode,
                                                 accessToken,
                                                 setAccessToken,
                                                 pendingOidcSignin,
                                                 setPendingOidcSignin,
                                                 children,
                                               }) => {
  const oidc = useOidc();
  const [loading, setLoading] = useState(false);
  const patchedRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  // ============================================================================
  // Fetch Patching for Bearer Token
  // ============================================================================

  useEffect(() => {
    // Keep latest token in a ref to avoid stale token in patched fetch
    if (oidc.user?.access_token) {
      tokenRef.current = oidc.user.access_token;
      setAccessToken(oidc.user.access_token);
    }

    if (oidc.isAuthenticated && oidc.user?.access_token && !patchedRef.current) {
      // Store original fetch if not already stored
      if (!window._originalFetch) {
        window._originalFetch = window.fetch;
      }

      // Patch fetch to include bearer token
      window.fetch = async (...args: Parameters<typeof fetch>) => {
        const [url, options = {}] = args;
        const originalFetch = window._originalFetch ?? window.fetch;

        // Add bearer token for API requests without existing auth header
        if (
          typeof url === 'string' &&
          url.startsWith(config.API_BASE_URL) &&
          !hasAuthorizationHeader(options.headers) &&
          tokenRef.current
        ) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${tokenRef.current}`);
          return originalFetch(url, { ...options, headers, credentials: 'include' });
        }

        return originalFetch(...args);
      };

      patchedRef.current = true;
    }
  }, [oidc.isAuthenticated, oidc.user?.access_token, setAccessToken]);

  // ============================================================================
  // Handle Pending OIDC Signin
  // ============================================================================

  useEffect(() => {
    const handlePendingSignin = async () => {
      if (pendingOidcSignin && !oidc.isAuthenticated) {
        try {
          await oidc.signinRedirect();
        } catch (error) {
          console.error('OIDC signin redirect failed:', error);
        } finally {
          setPendingOidcSignin(false);
        }
      }
    };

    void handlePendingSignin();
  }, [pendingOidcSignin, oidc.isAuthenticated, oidc, setPendingOidcSignin]);

  // ============================================================================
  // Handle Post-Authentication Flow
  // ============================================================================

  useEffect(() => {
    const handlePostAuth = async () => {
      if (!oidc.isAuthenticated || sessionUser) return;

      setLoading(true);
      try {
        const response = await fetch(`${config.API_BASE_URL}/users/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSessionUser(data.email);
        } else {
          // Fallback to ID token claims
          const email =
            (oidc.user?.profile as any)?.email ||
            (oidc.user?.profile as any)?.upn ||
            null;
          setSessionUser(email);
        }

        setAuthMode('oidc');
        handlePostLoginRedirect();
      } catch (error) {
        console.error('Failed to load profile after OIDC login:', error);
      } finally {
        setLoading(false);
      }
    };

    void handlePostAuth();
  }, [oidc.isAuthenticated, oidc.user?.profile, sessionUser, setSessionUser, setAuthMode]);

  // ============================================================================
  // Context Value for OIDC Mode
  // ============================================================================

  const contextValue = useMemo(
    (): AuthContextType => ({
      user: sessionUser,
      loading: loading || oidc.isLoading,
      isAuthenticated: !!sessionUser,
      authMode: sessionUser ? 'oidc' : null,
      signin: async (_user: string, callback: VoidFunction) => {
        callback(); // Not used in OIDC mode
      },
      signinOIDC: async () => {
        if (!oidc.isAuthenticated) {
          await oidc.signinRedirect();
        }
      },
      signout: async (callback?: VoidFunction) => {
        if (sessionUser) {
          try {
            await oidc.signoutRedirect();
          } catch (error) {
            console.error('OIDC signout failed:', error);
          }
        }

        // Restore original fetch
        if (window._originalFetch) {
          window.fetch = window._originalFetch;
          window._originalFetch = undefined;
        }
        patchedRef.current = false;
        tokenRef.current = null;

        setSessionUser(null);
        setAccessToken(null);
        callback?.();
      },
      getAccessToken: async () => accessToken,
    }),
    [sessionUser, loading, oidc.isAuthenticated, oidc, accessToken, setSessionUser, setAccessToken]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
