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


export interface AuthContextType {
  user: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signinOIDC: (callback?: VoidFunction) => Promise<void>;
  signout: (callback?: VoidFunction) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

  interface OidcBridgeProps extends PropsWithChildren {
    sessionUser: string | null;
    setSessionUser: (user: string | null) => void;
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
      automaticSilentRenew: true,
      monitorSession: true,
      onSigninCallback: () => {
        // We will handle the redirect in OidcBridge after profile sync
      },
    };
  } catch (error) {
    console.error('Failed to load OIDC config:', error);

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
      if (window.location.pathname !== target || window.location.pathname === '/oidc/callback') {
        window.location.replace(target);
      }
    } else if (window.location.pathname === '/oidc/callback') {
      window.location.replace(window.location.origin);
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [oidcConfig, setOidcConfig] = useState<AuthProviderProps | null>(null);
  const [pendingOidcSignin, setPendingOidcSignin] = useState(false);

  // ============================================================================
  // Initial Authentication Check
  // ============================================================================

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      // Load OIDC config
      const cfg = await fetchOidcConfig();
      if (cancelled) return;

      if (cfg) {
        setOidcConfig(cfg);
      }
      setLoading(false);
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  const signinOIDC = useCallback(async (): Promise<void> => {
    try {
      if (oidcConfig) {
        setPendingOidcSignin(true);
        return;
      }

      // Fallback: load config if not present
      const config = await fetchOidcConfig();
      if (config) {
        setOidcConfig(config);
        setPendingOidcSignin(true);
      } else {
        throw new Error('Failed to load OIDC configuration');
      }
    } catch (error) {
      console.error('Failed to initialize OIDC:', error);
      throw error;
    }
  }, [oidcConfig]);

  const signout = useCallback(
    async (callback?: VoidFunction): Promise<void> => {
      setUser(null);
      setAccessToken(null);
      callback?.();
    },
    []
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
      signinOIDC,
      signout,
      getAccessToken,
    }),
    [user, loading, signinOIDC, signout, getAccessToken]
  );

  // ============================================================================
  // Render Logic
  // ============================================================================

  // OIDC provider configuration
  const oidcProviderConfig = useMemo(() => {
    if (!oidcConfig) return null;
    return {
      ...oidcConfig,
      redirect_uri: `${window.location.origin}/oidc/callback`,
      post_logout_redirect_uri: window.location.origin,
      automaticSilentRenew: true,
      monitorSession: true,
      onSigninCallback: () => {
        // We will handle the redirect in OidcBridge after profile sync
      },
    } as AuthProviderProps;
  }, [oidcConfig]);

  // If config not loaded, use base context
  if (!oidcConfig || !oidcProviderConfig) {
    return (
      <AuthContext.Provider value={baseValue}>{children}</AuthContext.Provider>
    );
  }

  return (
    <OidcProvider {...oidcProviderConfig}>
      <OidcBridge
        sessionUser={user}
        setSessionUser={setUser}
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
    } else if (!oidc.isAuthenticated) {
      // Clear token if not authenticated
      tokenRef.current = null;
      setAccessToken(null);
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
      // If oidc is still loading, wait
      if (oidc.isLoading) return;

      // If we are authenticated, sync session user
      if (oidc.isAuthenticated && oidc.user) {
        if (!sessionUser) {
          setLoading(true);
          try {
            const email =
              (oidc.user?.profile as any)?.email ||
              (oidc.user?.profile as any)?.preferred_username ||
              null;
            setSessionUser(email);
            handlePostLoginRedirect();
          } catch (error) {
            console.error('Failed to load profile after OIDC login:', error);
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      // If we are here, we are not authenticated (either never were, or session expired)
      // Ensure local session user is cleared if OIDC says we are not authenticated
      if (sessionUser) {
        setSessionUser(null);
      }

      // If not authenticated and not in a signin process, we might need to re-auth
      // But we should be careful not to trigger it if we are on the login page or callback page
      const isCallbackPage = window.location.pathname === '/oidc/callback';
      const isLoginPage = window.location.pathname === '/login';

      if (!oidc.isAuthenticated && !oidc.isLoading && !isCallbackPage && !isLoginPage) {
        // If we are on a protected route (RequireAuth will handle this usually),
        // but we want to be proactive about expired tokens.

        // Check if we have an expired user in storage
        const user = oidc.user;
        if (user && user.expired) {
            console.log('Token expired, triggering re-auth');
            await oidc.signinRedirect();
            return;
        }

        // If there is no user at all, LoginPage will handle redirect for protected routes.
        // But if we want to ensure "not expired" check on load, we can also check if there
        // is something in sessionStorage that looks like a user but oidc.user is null.
        // oidc-client-ts usually cleans up expired users if configured, or just marks them expired.
      }
    };

    void handlePostAuth();
  }, [oidc.isAuthenticated, oidc.isLoading, oidc.user, sessionUser, setSessionUser]);

  // ============================================================================
  // Context Value for OIDC Mode
  // ============================================================================

  const contextValue = useMemo(
    (): AuthContextType => ({
      user: sessionUser,
      loading: loading || oidc.isLoading,
      isAuthenticated: !!sessionUser || (oidc.isAuthenticated && !oidc.isLoading),
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
    [sessionUser, loading, oidc.isAuthenticated, oidc.isLoading, oidc.signinRedirect, oidc.signoutRedirect, accessToken, setSessionUser, setAccessToken]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
