import { useMemo } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import config from "../config";

export function useAuth() {
  const auth = useOidcAuth();

  const roles = useMemo(() => {
    // 1. Try to get roles from ID Token (profile)
    const profileRoles = (auth.user?.profile?.realm_access as { roles?: string[] })?.roles || (auth.user?.profile?.role as string[]) || (auth.user?.profile?.roles as string[]);

    if (!auth.user) {
      return [];
    }

    let rawRoles: string[] = [];
    if (Array.isArray(profileRoles)) {
      rawRoles = profileRoles;
    } else if (typeof profileRoles === 'string') {
      rawRoles = [profileRoles];
    }

    // 2. Try to get roles from Access Token (manually parse) if profile roles are empty
    if (rawRoles.length === 0 && auth.user?.access_token) {
      try {
        const parts = auth.user.access_token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const accessTokenRoles = (payload?.realm_access as { roles?: string[] })?.roles || payload?.role || payload?.roles;
          if (Array.isArray(accessTokenRoles)) {
            rawRoles = accessTokenRoles;
          } else if (typeof accessTokenRoles === 'string') {
            rawRoles = [accessTokenRoles];
          }
        }
      } catch (e) {
        // Fallback or ignore
      }
    }

    // Map roles based on config
    const mappedRoles = new Set<string>();
    const roleMapping = config.ROLE_MAPPING as Record<string, string[]>;

    rawRoles.forEach(role => {
      // Keep the original role
      mappedRoles.add(role);

      // Add mapped roles
      Object.entries(roleMapping).forEach(([appRole, providerRoles]) => {
        if (providerRoles.includes(role)) {
          mappedRoles.add(appRole);
        }
      });
    });

    return Array.from(mappedRoles);
  }, [auth.user]);

  return {
    ...auth,
    user: auth.user ? (auth.user?.profile.email || auth.user?.profile.preferred_username || auth.user?.profile.sub || null) : null,
    roles: roles,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.isLoading,
    signout: async () => {
      await auth.signoutRedirect({
        post_logout_redirect_uri: config.OIDC_POST_LOGOUT_REDIRECT_URI,
      });
    },
    signin: () => {
      auth.signinRedirect();
    }
  };
}
