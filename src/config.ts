const local = {
  API_BASE_URL: 'http://localhost:8000/api/app/v1',
  WS_URL: 'ws://localhost:8000/api/jean/v1/ws'
};

const dev = {
  API_BASE_URL: '/api/app/v1',
  WS_URL: 'ws://dev.example.com/api/app/v1/ws'
};

const prod = {
  API_BASE_URL: '/api/app/v1',
  WS_URL: 'ws://example.com/api/app/v1/ws'
};

const stage = import.meta.env.VITE_STAGE || 'local';
const envVariables = stage === 'prod' ? prod : stage === 'dev' ? dev : local;

const config = {
  MAX_ATTACHMENT_SIZE: 5000000,
  PATH_ROOT: '',
  ...envVariables
};

export default config;
