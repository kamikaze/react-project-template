const local = {
  API_BASE_URL: 'http://localhost:8080/api/v1',
  WS_URL: 'ws://localhost:8080/api/v1/ws'
};

const dev = {
  API_BASE_URL: '/api/v1',
  WS_URL: 'ws://dev.example.com/api/v1/ws'
};

const prod = {
  API_BASE_URL: '/api/v1',
  WS_URL: 'ws://example.com/api/v1/ws'
};

const stage = import.meta.env.VITE_STAGE || 'local';
const envVariables = stage === 'prod' ? prod : stage === 'dev' ? dev : local;

const config = {
  MAX_ATTACHMENT_SIZE: 5000000,
  PATH_ROOT: '',
  ...envVariables
};

export default config;
