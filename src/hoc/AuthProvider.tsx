import React, {createContext, type PropsWithChildren, useEffect, useMemo, useRef, useState} from 'react';
import config from '../config';
import { AuthProvider as OidcProvider, useAuth as useOidc } from 'react-oidc-context';

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
  signinOIDC: (callback?: VoidFunction) => Promise<void>;  // OIDC signin
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
  const [oidcCfg, setOidcCfg] = useState<{ authority: string; client_id: string; redirect_uri: string } | null>(null);
  const [pendingOidcSignin, setPendingOidcSignin] = useState<boolean>(false);

  // Load OIDC config on app load, then check legacy session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) Always load OIDC config first so Provider (when mounted) uses backend values
        const cfgResp = await fetch(`${config.API_BASE_URL}/config`);
        if (cfgResp.ok) {
          const cfgData = await cfgResp.json();
          if (!cancelled) {
            setOidcCfg({ authority: cfgData.oidc_authority_url, client_id: cfgData.oidc_client_id, redirect_uri: cfgData.redirect_uri });
          }
        } else {
          console.warn(`/config returned non-OK status: ${cfgResp.status}`);
        }
      } catch (e) {
        console.error('Failed to load OIDC /config:', e);
      }

      try {
        // 2) Then check if there is an existing legacy session
        const me = await fetch(`${config.API_BASE_URL}/users/me`, { credentials: 'include' });
        if (me.ok) {
          const data = await me.json();
          if (!cancelled) {
            setUser(data.email);
            setAuthMode('session');
            setLoading(false);
          }
          return;
        } else {
          console.warn(`/users/me returned non-OK status: ${me.status}`);
        }
      } catch (e) {
        console.log('No active session, falling back to OIDC');
      }

      // 3) No session -> switch to OIDC mode and finish loading (config may already be present)
      if (!cancelled) {
        setAuthMode('oidc');
        setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

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

  // Until OIDC config known, provide minimal context state
  const baseValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    authMode,
    signin,
    // Ensure clicking the button always kicks off OIDC, even if config
    // hasn't finished loading yet. We bootstrap OIDC on demand and
    // mark a pending sign-in so the bridge can trigger signinRedirect
    // as soon as the provider mounts.
    signinOIDC: async () => {
      try {
        if (authMode === 'oidc' && oidcCfg) {
          setPendingOidcSignin(true);
          return;
        }
        if (oidcCfg) {
          // Config already loaded on app start, just switch to OIDC mode
          setAuthMode('oidc');
          setPendingOidcSignin(true);
          return;
        }
        // Fallback: load config if not present (e.g., earlier load failed)
        const resp = await fetch(`${config.API_BASE_URL}/config`);
        const data = await resp.json();
        setOidcCfg({ authority: data.oidc_authority_url, client_id: data.oidc_client_id, redirect_uri: data.oidc_redirect_uri });
        setAuthMode('oidc');
        setPendingOidcSignin(true);
      } catch (e) {
        console.error('Failed to initialize OIDC on demand', e);
        throw e;
      }
    },
    signout: (cb?: VoidFunction) => {
      if (authMode === 'session') {
        // fire-and-forget logout
        void fetch(`${config.API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
          .catch(() => {});
        // clear local session state
        setUser(null);
        setAccessToken(null);
        setAuthMode(null);
      }
      if (cb) cb();
    },
    getAccessToken: async () => accessToken,
  }), [user, loading, authMode, accessToken]);

  // If not in OIDC mode, just render children with base context
  if (authMode !== 'oidc' || !oidcCfg) {
    return <AuthContext.Provider value={baseValue}>{children}</AuthContext.Provider>;
  }

  // OIDC provider configuration
  const oidcProviderConfig = {
    authority: oidcCfg.authority,
    client_id: oidcCfg.client_id,
    redirect_uri: oidcCfg.redirect_uri,
    post_logout_redirect_uri: window.location.origin + '/login',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    onSigninCallback: () => {
      // remove auth response params from the URL after successful login, preserve search
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  };

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

// Inner component that binds react-oidc-context to our AuthContext
const OidcBridge: React.FC<{
  sessionUser: string | null;
  setSessionUser: (u: string | null) => void;
  setAuthMode: (m: AuthMode) => void;
  accessToken: string | null;
  setAccessToken: (t: string | null) => void;
  pendingOidcSignin: boolean;
  setPendingOidcSignin: (b: boolean) => void;
  children: React.ReactNode;
}> = ({ sessionUser, setSessionUser, setAuthMode, accessToken, setAccessToken, pendingOidcSignin, setPendingOidcSignin, children }) => {
  const oidc = useOidc();
  const [loading, setLoading] = useState(false);
  const patchedRef = useRef(false);

  // Patch fetch with bearer token when authenticated
  useEffect(() => {
    if (oidc.isAuthenticated && oidc.user?.access_token && !patchedRef.current) {
      const token = oidc.user.access_token;
      setAccessToken(token);
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
        return Object.keys(headersInit as any).some(k => k.toLowerCase() === 'authorization');
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
      patchedRef.current = true;
    }
  }, [oidc.isAuthenticated, oidc.user?.access_token]);

  // If the user clicked the OIDC button before the provider was ready,
  // we set a pending flag. Once here, trigger the redirect exactly once.
  useEffect(() => {
    (async () => {
      if (pendingOidcSignin) {
        try {
          if (!oidc.isAuthenticated) {
            await oidc.signinRedirect();
          }
        } finally {
          setPendingOidcSignin(false);
        }
      }
    })();
  }, [pendingOidcSignin, oidc.isAuthenticated, oidc, setPendingOidcSignin]);

  // When OIDCAuthenticated, fetch /users/me and redirect if needed
  useEffect(() => {
    (async () => {
      if (oidc.isAuthenticated && !sessionUser) {
        setLoading(true);
        try {
          const res = await fetch(`${config.API_BASE_URL}/users/me`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setSessionUser(data.email);
          } else {
            // fallback to email/username from Id token
            const email = (oidc.user?.profile as any)?.email || (oidc.user?.profile as any)?.upn || null;
            setSessionUser(email);
          }
          setAuthMode('oidc');
          // Post login redirect
          try {
            const target = sessionStorage.getItem('postLoginRedirect');
            if (target) {
              sessionStorage.removeItem('postLoginRedirect');
              if (window.location.pathname !== target) {
                window.location.replace(target);
              }
            }
          } catch {}
        } catch (e) {
          console.error('Failed to load profile after OIDC login', e);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [oidc.isAuthenticated]);

  const contextValue = useMemo(() => ({
    user: sessionUser,
    loading: loading || oidc.isLoading,
    isAuthenticated: !!sessionUser,
    authMode: sessionUser ? ('oidc' as AuthMode) : null,
    signin: async (u: string, cb: VoidFunction) => { cb(); }, // not used in OIDC mode
    signinOIDC: async () => {
      if (!oidc.isAuthenticated) {
        await oidc.signinRedirect();
      }
    },
    signout: (cb?: VoidFunction) => {
      if (sessionUser) {
        // fire and forget
        void oidc.signoutRedirect();
      }
      if (window._originalFetch) {
        window.fetch = window._originalFetch;
        window._originalFetch = undefined;
      }
      setSessionUser(null);
      setAccessToken(null);
      if (cb) cb();
    },
    getAccessToken: async () => accessToken,
  }), [sessionUser, loading, accessToken, oidc.isAuthenticated, oidc, setSessionUser, setAccessToken]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
