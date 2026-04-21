import { type ReactNode } from 'react';
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { userManager } from '../auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <OidcProvider userManager={userManager}>{children}</OidcProvider>;
};
