import React, {useCallback, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Button, Layout, message} from 'antd';
import {useTranslation} from 'react-i18next';
import {LoginOutlined} from '@ant-design/icons';
import {useAuth} from '../hook/useAuth';

// ============================================================================
// Constants
// ============================================================================

const {Content} = Layout;

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';
const DEFAULT_REDIRECT_PATH = '/';

// ============================================================================
// Types
// ============================================================================

interface LocationState {
  from?: {
    pathname: string;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

const parseRedirectPath = (rawPath: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawPath);
    const url = new URL(decoded, window.location.origin);
    return url.pathname + url.search + url.hash;
  } catch {
    // Fallback: accept if it looks like a relative path
    return rawPath.startsWith('/') ? rawPath : null;
  }
};

const getRedirectPath = (location: ReturnType<typeof useLocation>): string => {
  // Priority: router state > query param > default
  const stateFrom = (location.state as LocationState)?.from?.pathname;
  if (stateFrom) return stateFrom;

  const queryParams = new URLSearchParams(location.search);
  const fromPageParam = queryParams.get('fromPage');
  if (fromPageParam) {
    const parsed = parseRedirectPath(fromPageParam);
    if (parsed) return parsed;
  }

  return DEFAULT_REDIRECT_PATH;
};

const extractAuthError = (): { error: string | null; description: string | null } => {
  try {
    const queryParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashString);

    const error = queryParams.get('error') || hashParams.get('error');
    const description =
      queryParams.get('error_description') || hashParams.get('error_description');

    return {error, description};
  } catch {
    return {error: null, description: null};
  }
};


// ============================================================================
// Main Component
// ============================================================================

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {signinOIDC, user, loading} = useAuth();
  const {t} = useTranslation();

  const redirectPath = getRedirectPath(location);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleOidcLogin = useCallback(async (): Promise<void> => {
    // Preserve intended route across redirects
    if (redirectPath !== DEFAULT_REDIRECT_PATH) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectPath);
    }

    try {
      await signinOIDC();
    } catch (error: any) {
      message.error(error?.message || 'Authentication failed');
      console.error('OIDC login error:', error);
    }
  }, [signinOIDC, redirectPath]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Display authentication errors from IdP redirect
  useEffect(() => {
    const {error, description} = extractAuthError();

    if (error || description) {
      const errorMessage = description || error || 'Authentication failed';
      message.error(decodeURIComponent(errorMessage));
    }
  }, [t]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Layout>
      <Layout style={{padding: '0 24px 24px'}}>
        <Content
          className="site-layout-background"
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2>{t('Login')}</h2>
            <p>{t('Please choose an authentication method:')}</p>
            <Button
              type="primary"
              size="large"
              onClick={handleOidcLogin}
              icon={<LoginOutlined/>}
            >
              {t('Log in with OIDC')}
            </Button>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
