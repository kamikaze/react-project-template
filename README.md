# React + TypeScript + Vite

## Runtime stages and running in "local" mode

The app reads a simple stage flag to choose API/WebSocket endpoints. See `src/config.ts`:

- local (default):
  - API_BASE_URL: `http://localhost:8080/api/v1`
  - WS_URL: `ws://localhost:8080/api/v1/ws`
- dev:
  - API_BASE_URL: `/api/v1`
  - WS_URL: `ws://dev.example.com/api/v1/ws`
- prod:
  - API_BASE_URL: `/api/v1`
  - WS_URL: `ws://example.com/api/v1/ws`

The stage is selected by the Vite env variable `VITE_STAGE`. If it is not set, `local` is used by default.

### Run locally (backend at http://localhost:8080)

Use one of the following:

- pnpm: `pnpm dev:local`
- npm: `npm run dev:local`
- yarn: `yarn dev:local`

Alternatively, you can run the default dev server (which also uses `local` because `VITE_STAGE` is unset):

- pnpm: `pnpm dev`
- npm: `npm run dev`
- yarn: `yarn dev`

### Build for a stage

- Local: `pnpm build:local` (or `npm run build:local`)
- Dev: `pnpm build:dev`
- Prod: `pnpm build:prod`

These scripts simply export `VITE_STAGE` for the build so `src/config.ts` can pick the correct endpoints at compile time.

### Notes about authentication (OIDC)

- When running locally, the frontend expects a backend available at `http://localhost:8080` that provides:
  - Session endpoints: `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/users/me`
  - OIDC config endpoint: `/api/v1/config` returning `oidc_client_id` and `oidc_authority_url`
- Click the "Log in with" button on the login page to start the OIDC redirect flow.

---

The sections below are the default Vite template notes.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
