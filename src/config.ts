const local = {
  API_BASE_URL: 'http://localhost:8000/api/app/v1',
  OIDC_AUTHORITY: 'http://localhost:8085/realms/app',
  OIDC_CLIENT_ID: 'frontend',
  OIDC_REDIRECT_URI: 'http://localhost:5173',
  OIDC_POST_LOGOUT_REDIRECT_URI: 'http://localhost:5173',
  ROLE_MAPPING: {
    'admin': ['admin']
  }
};

const dev = {
  API_BASE_URL: '/api/app/v1',
  OIDC_AUTHORITY: 'http://localhost:8085/realms/app',
  OIDC_CLIENT_ID: 'frontend',
  OIDC_REDIRECT_URI: window.location.origin,
  OIDC_POST_LOGOUT_REDIRECT_URI: window.location.origin,
  ROLE_MAPPING: {
    'admin': ['admin']
  }
};

const prod = {
  API_BASE_URL: '/api/app/v1',
  OIDC_AUTHORITY: 'http://localhost:8085/realms/app',
  OIDC_CLIENT_ID: 'frontend',
  OIDC_REDIRECT_URI: window.location.origin,
  OIDC_POST_LOGOUT_REDIRECT_URI: window.location.origin,
  ROLE_MAPPING: {
    'admin': ['admin']
  }
};

const stage = import.meta.env.VITE_STAGE || 'local';
const envVariables = stage === 'prod' ? prod : stage === 'dev' ? dev : local;

const config = {
  MAX_ATTACHMENT_SIZE: 5000000,
  PATH_ROOT: '',
  ...envVariables
};

export default config;
