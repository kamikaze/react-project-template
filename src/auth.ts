import { UserManager } from 'oidc-client-ts';
import config from './config';

export const userManager = new UserManager({
  authority: config.OIDC_AUTHORITY,
  client_id: config.OIDC_CLIENT_ID,
  redirect_uri: config.OIDC_REDIRECT_URI,
  post_logout_redirect_uri: config.OIDC_POST_LOGOUT_REDIRECT_URI,

  scope: "openid profile email",

  automaticSilentRenew: true,

  metadata: {
    issuer: config.OIDC_AUTHORITY,

    authorization_endpoint: `${config.OIDC_AUTHORITY}/protocol/openid-connect/auth`,
    token_endpoint: `${config.OIDC_AUTHORITY}/protocol/openid-connect/token`,
    userinfo_endpoint: `${config.OIDC_AUTHORITY}/protocol/openid-connect/userinfo`,
    end_session_endpoint: `${config.OIDC_AUTHORITY}/protocol/openid-connect/logout`,
    jwks_uri: `${config.OIDC_AUTHORITY}/protocol/openid-connect/certs`,

    check_session_iframe: `${config.OIDC_AUTHORITY}/protocol/openid-connect/login-status-iframe.html`,
    revocation_endpoint: `${config.OIDC_AUTHORITY}/protocol/openid-connect/revoke`,
  },
});

userManager.events.addAccessTokenExpiring(() => {
  console.log("Token expiring...");
});

userManager.events.addAccessTokenExpired(() => {
  console.log("Token expired.");
});

userManager.events.addSilentRenewError((e) => {
  console.error("Silent renew error", e);
});

userManager.events.addUserLoaded((user) => {
  console.log("User loaded", user);
});

export const buildHeaders = async (extraHeaders: Record<string, string> = {}): Promise<HeadersInit> => {
  const user = await userManager.getUser();
  const token = user?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const authLoader = (loader: Function) => async (args: any) => {
  return await loader(args);
};

export { authLoader };
