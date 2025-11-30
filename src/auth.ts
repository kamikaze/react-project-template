import {redirect} from 'react-router-dom';

const authLoader = (loader: Function) => async (args: any) => {
  try {
    return await loader(args);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const fromPage = encodeURIComponent(args.request.url);

      return redirect(`/login?fromPage=${fromPage}`);
    }
    throw error;
  }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

export const authenticatedUserProfileRequest = {
  scopes: ['openid', 'profile', 'email'],
};

export { authLoader };
