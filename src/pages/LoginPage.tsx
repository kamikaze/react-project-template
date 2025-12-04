import React, {useCallback, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Button, Form, Input, Layout, message} from 'antd';
import {useTranslation} from 'react-i18next';
import {LoginOutlined} from '@ant-design/icons';
import {useAuth} from '../hook/useAuth';

// ============================================================================
// Constants
// ============================================================================

const {Content} = Layout;

const FORM_LAYOUT = {
  labelCol: {span: 8},
  wrapperCol: {span: 16},
};

const TAIL_LAYOUT = {
  wrapperCol: {offset: 8, span: 16},
};

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';
const DEFAULT_REDIRECT_PATH = '/';

// ============================================================================
// Types
// ============================================================================

interface LoginFormValues {
  username: string;
  password: string;
}

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
  const {signin, signinOIDC, user} = useAuth();
  const {t} = useTranslation();

  const redirectPath = getRedirectPath(location);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleLegacyLogin = useCallback(
    async (values: LoginFormValues): Promise<void> => {
      try {
        await signin(values.username, () => {
          message.success('Login succeeded');
          navigate(redirectPath, {replace: true});
        });
      } catch (error) {
        message.error('Login failed. Please check your credentials.');
        console.error('Legacy login error:', error);
      }
    },
    [signin, navigate, redirectPath]
  );

  const handleFormFailed = useCallback((errorInfo: any): void => {
    console.error('Form validation failed:', errorInfo);
  }, []);

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

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!user) return;

    const storedRedirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    const targetPath = storedRedirect || redirectPath;

    if (storedRedirect) {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    }

    if (location.pathname !== targetPath) {
      navigate(targetPath, {replace: true});
    }
  }, [user, location.pathname, navigate, redirectPath]);

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
          }}
        >
          <Form<LoginFormValues>
            {...FORM_LAYOUT}
            name="login-form"
            initialValues={{username: '', password: ''}}
            onFinish={handleLegacyLogin}
            onFinishFailed={handleFormFailed}
            style={{maxWidth: 600, margin: '0 auto'}}
          >
            {/* Username Field */}
            <Form.Item
              label={t('Username')}
              name="username"
              rules={[
                {
                  required: true,
                  message: t('Please input your username!'),
                },
              ]}
            >
              <Input placeholder={t('Username')} autoComplete="username"/>
            </Form.Item>

            {/* Password Field */}
            <Form.Item
              label={t('Password')}
              name="password"
              rules={[
                {
                  required: true,
                  message: t('Please input your password!'),
                },
              ]}
            >
              <Input.Password
                placeholder={t('Password')}
                autoComplete="current-password"
              />
            </Form.Item>

            {/* Action Buttons */}
            <Form.Item {...TAIL_LAYOUT}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined/>}
                style={{marginRight: 8}}
              >
                {t('Log in')}
              </Button>
              <Button
                type="default"
                onClick={handleOidcLogin}
                icon={<LoginOutlined/>}
              >
                {t('Log in with')}
              </Button>
            </Form.Item>
          </Form>
        </Content>
      </Layout>
    </Layout>
  );
};
